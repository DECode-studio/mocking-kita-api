#!/usr/bin/env ruby
# frozen_string_literal: true

require 'base64'
require 'json'
require 'optparse'
require 'psych'
require 'set'
require 'time'
require 'uri'

STAGES = %w[LOCAL DEVELOPMENT TESTING STAGING PRODUCTION].freeze
RESPONSE_TAG = /\{%\s*response\s*['"]?(body|header)['"]?\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"][^%]*%\}/.freeze
BASE_URL_TOKEN = /^\{\{\s*(?:_\.)?([a-zA-Z0-9_-]+)\s*\}\}(.*)$/m.freeze

def stage_for(name)
  normalized = name.to_s.downcase
  return 'LOCAL' if normalized.match?(/local|localhost/)
  return 'DEVELOPMENT' if normalized.match?(/dev|development/)
  return 'TESTING' if normalized.match?(/test|testing|qa/)
  return 'STAGING' if normalized.match?(/stag|staging/)
  return 'PRODUCTION' if normalized.match?(/prod|production/)

  'DEVELOPMENT'
end

def base_url_key?(key, value)
  key.to_s.match?(/(?:^|_)URL$|BASE_URL|API_URL|_URL_/i) ||
    value.to_s.match?(/\Ahttps?:\/\//i)
end

def normalize_json_path(path)
  path.to_s
      .sub(/^\$\./, '')
      .sub(/^\$/, '')
      .gsub(/\[(\w+)\]/, '.\1')
      .sub(/^\./, '')
end

def decode_filter(raw_filter)
  match = raw_filter.to_s.match(/\Ab64::([^:]+)::46b\z/)
  return normalize_json_path(raw_filter) unless match

  normalize_json_path(Base64.decode64(match[1]))
rescue StandardError
  normalize_json_path(raw_filter)
end

def variable_name(source_req_id, json_path)
  "#{source_req_id}_#{json_path}".gsub(/[^a-zA-Z0-9_]/, '_').gsub(/_+/, '_').sub(/_\z/, '')
end

def each_response_tag(text)
  text.to_s.scan(RESPONSE_TAG) do |from, source_req_id, raw_filter|
    json_path = decode_filter(raw_filter)
    yield from, source_req_id, raw_filter, json_path, variable_name(source_req_id, json_path)
  end
end

def replace_insomnia_tokens(value)
  return value unless value.is_a?(String)

  replaced = value.gsub(RESPONSE_TAG) do
    match = Regexp.last_match
    source_req_id = match[2]
    json_path = decode_filter(match[3])
    "{{#{variable_name(source_req_id, json_path)}}}"
  end

  replaced.gsub(/\{\{\s*_\.([a-zA-Z0-9_-]+)\s*\}\}/, '{{\1}}')
end

def normalize_list_to_map(items)
  result = {}
  Array(items).each do |item|
    next unless item.is_a?(Hash)
    next if item['disabled'] || item['name'].to_s.empty?

    result[item['name']] = replace_insomnia_tokens(item['value'].to_s)
  end
  result
end

def parse_body(req)
  body = req['body']
  return [{}, 'NONE'] unless body.is_a?(Hash)

  text = body['text']
  return [{}, 'NONE'] if text.nil? || text.to_s.strip.empty?

  content_type = body['mimeType'].to_s.downcase
  clean_text = replace_insomnia_tokens(text.to_s)

  if content_type.include?('x-www-form-urlencoded')
    return [clean_text, 'URL_ENCODED']
  end

  if content_type.include?('multipart')
    return [clean_text, 'FORM_DATA']
  end

  begin
    [JSON.parse(clean_text), 'JSON']
  rescue JSON::ParserError
    [clean_text, 'JSON']
  end
end

def traverse_collection(items, parent_path = [], requests = [], order = { value: 0 })
  Array(items).each do |item|
    next unless item.is_a?(Hash)

    if item['children'].is_a?(Array)
      traverse_collection(item['children'], parent_path + [item['name'].to_s], requests, order)
    elsif item['url'] && item['method']
      order[:value] += 1
      req_id = item.dig('meta', 'id') || item['_id'] || "generated_req_#{order[:value]}"
      requests << {
        id: req_id,
        req: item,
        folder_path: parent_path.reject(&:empty?).join(' / '),
        traversal_order: order[:value],
        sort_key: item.dig('meta', 'sortKey') || order[:value]
      }
    end
  end
  requests
end

def extract_after_response(script)
  extractors = []
  script.to_s.scan(/insomnia\.environment\.set\(\s*["']([^"']+)["']\s*,\s*response\.([a-zA-Z0-9_.\[\]]+)\s*\)/) do |var, path|
    extractors << {
      'variable' => var,
      'from' => 'body',
      'path' => normalize_json_path(path)
    }
  end
  extractors
end

def build_environment_template(parsed, warnings)
  env_root = parsed['environments'].is_a?(Hash) ? parsed['environments'] : {}
  stage_data = {}

  base_data = env_root['data'].is_a?(Hash) ? env_root['data'] : {}
  stage_data['DEVELOPMENT'] = base_data unless base_data.empty?

  Array(env_root['subEnvironments']).each do |subenv|
    next unless subenv.is_a?(Hash) && subenv['data'].is_a?(Hash)

    stage = stage_for(subenv['name'])
    stage_data[stage] ||= {}
    stage_data[stage].merge!(subenv['data'])
  end

  base_keys = Set.new
  variable_keys = Set.new
  stage_data.each_value do |data|
    data.each do |key, value|
      if base_url_key?(key, value)
        base_keys << key
      else
        variable_keys << key
      end
    end
  end

  warnings << 'No base URL environment variables found.' if base_keys.empty?

  environments = base_keys.sort.map.with_index do |key, index|
    values = STAGES.to_h { |stage| [stage, nil] }
    stage_data.each do |stage, data|
      values[stage] = data[key].to_s if data.key?(key) && !data[key].to_s.empty?
    end

    {
      'id' => key,
      'name' => key,
      'isBaseUrl' => true,
      'environmentType' => values['DEVELOPMENT'] ? 'DEVELOPMENT' : stage_data.keys.first || 'DEVELOPMENT',
      'values' => values,
      'variables' => [],
      'isDefault' => index.zero?
    }
  end

  flow_variables = {}
  preferred_stage = stage_data.key?('DEVELOPMENT') ? 'DEVELOPMENT' : stage_data.keys.first
  if preferred_stage
    variable_keys.sort.each do |key|
      value = stage_data[preferred_stage][key]
      flow_variables[key] = value unless value.nil?
    end
  end

  [environments, flow_variables]
end

def sort_requests(requests, dependencies, warnings)
  by_id = requests.to_h { |item| [item[:id], item] }
  inbound = Hash.new { |h, k| h[k] = Set.new }
  outbound = Hash.new { |h, k| h[k] = Set.new }

  requests.each { |item| inbound[item[:id]] }
  dependencies.each do |target, sources|
    sources.each do |source|
      unless by_id.key?(source)
        warnings << "Missing dependency source #{source} referenced by #{target}."
        next
      end
      inbound[target] << source
      outbound[source] << target
    end
  end

  ready = requests.select { |item| inbound[item[:id]].empty? }
                  .sort_by { |item| [item[:sort_key].to_i, item[:traversal_order]] }
  sorted = []

  until ready.empty?
    current = ready.shift
    sorted << current
    outbound[current[:id]].each do |target|
      inbound[target].delete(current[:id])
      if inbound[target].empty?
        ready << by_id[target]
        ready.sort_by! { |item| [item[:sort_key].to_i, item[:traversal_order]] }
      end
    end
  end

  if sorted.length != requests.length
    remaining = requests.reject { |item| sorted.include?(item) }
    warnings << "Dependency cycle or unresolved ordering for #{remaining.length} request(s); appended by folder/sort order."
    sorted.concat(remaining.sort_by { |item| [item[:sort_key].to_i, item[:traversal_order]] })
  end

  sorted
end

def convert(input_path)
  raw = File.read(input_path, encoding: 'UTF-8')
  parsed = if input_path.end_with?('.json')
             JSON.parse(raw)
           else
             Psych.safe_load(raw, permitted_classes: [Time, Date], aliases: true)
           end

  warnings = []
  requests = traverse_collection(parsed['collection'])
  by_id = requests.to_h { |item| [item[:id], item] }
  extractors_by_req = Hash.new { |h, k| h[k] = [] }
  dependencies = Hash.new { |h, k| h[k] = Set.new }
  response_tag_count = 0
  pre_request_count = 0

  requests.each do |item|
    req = item[:req]
    scan_payload = {
      'url' => req['url'],
      'body' => req['body'],
      'parameters' => req['parameters'],
      'headers' => req['headers']
    }.to_json

    each_response_tag(scan_payload) do |from, source_req_id, _raw_filter, json_path, var_name|
      response_tag_count += 1
      source_extractors = extractors_by_req[source_req_id]
      extractor = {
        'variable' => var_name,
        'from' => from == 'header' ? 'headers' : 'body',
        'path' => json_path
      }
      source_extractors << extractor unless source_extractors.any? { |existing| existing['variable'] == var_name }
      dependencies[item[:id]] << source_req_id if by_id.key?(source_req_id)
    end

    Array(extract_after_response(req.dig('scripts', 'afterResponse'))).each do |extractor|
      extractors_by_req[item[:id]] << extractor unless extractors_by_req[item[:id]].any? { |e| e['variable'] == extractor['variable'] }
    end

    pre_script = req.dig('scripts', 'preRequest').to_s
    pre_request_count += 1 unless pre_script.strip.empty?
  end

  environments, flow_variables = build_environment_template(parsed, warnings)
  sorted_requests = sort_requests(requests, dependencies, warnings)

  steps = sorted_requests.map.with_index do |item, index|
    req = item[:req]
    description = replace_insomnia_tokens(req.dig('meta', 'description').to_s)
    raw_url = req['url'].to_s
    target_environment = nil
    path = raw_url

    if (match = raw_url.match(BASE_URL_TOKEN))
      target_environment = match[1]
      path = match[2]
    elsif raw_url.match?(/\Ahttps?:\/\//i)
      uri = URI(raw_url)
      target_environment = "#{uri.host}_BASE_URL".upcase.gsub(/[^A-Z0-9_]/, '_')
      path = uri.path
    end

    path = replace_insomnia_tokens(path)
    path = '/' if path.nil? || path.empty?

    body, body_type = parse_body(req)
    headers = normalize_list_to_map(req['headers'])
    query_params = normalize_list_to_map(req['parameters'])

    {
      'order' => index + 1,
      'name' => req['name'].to_s.empty? ? "Step #{index + 1}" : req['name'].to_s,
      'description' => description,
      'enabled' => true,
      'delayMs' => 0,
      'continueOnError' => false,
      'api' => {
        'method' => req['method'].to_s.upcase,
        'path' => path,
        'name' => req['name'].to_s,
        'collection' => item[:folder_path].empty? ? nil : item[:folder_path],
        'description' => description,
        'targetEnvironment' => target_environment,
        'environmentIds' => target_environment ? [target_environment] : []
      },
      'requestScenario' => {
        'name' => "#{req['name']} Scenario",
        'headers' => headers,
        'queryParams' => query_params,
        'pathParams' => {},
        'body' => body,
        'bodyType' => body_type
      },
      'expectedResponseScenario' => {
        'name' => "#{req['name']} Response",
        'statusCode' => 200,
        'headers' => {},
        'body' => {}
      },
      'overrides' => {
        'headers' => nil,
        'queryParams' => nil,
        'pathParams' => nil,
        'body' => nil,
        'bodyType' => body_type
      },
      'extractors' => extractors_by_req[item[:id]],
      'assertions' => [
        { 'type' => 'statusCode', 'operator' => 'equals', 'expected' => 200 }
      ]
    }
  rescue URI::InvalidURIError
    warnings << "Invalid absolute URL in request #{item[:id]}: #{raw_url}"
    retry
  end

  if pre_request_count.positive?
    warnings << "#{pre_request_count} request(s) contain preRequest scripts; scripts are not executable in Scenario Flow import."
  end

  template = {
    '$schema' => 'mock-api-studio/scenario-flow/v1',
    'version' => '1.0',
    'exportedAt' => Time.now.utc.iso8601,
    'environments' => environments,
    'flow' => {
      'name' => parsed['name'].to_s.empty? ? 'Imported Insomnia Flow' : parsed['name'].to_s,
      'description' => parsed.dig('meta', 'description').to_s.empty? ? 'Converted from Insomnia collection' : parsed.dig('meta', 'description').to_s,
      'stopOnFailure' => true,
      'variables' => flow_variables
    },
    'steps' => steps,
    'x-conversionSummary' => {
      'source' => File.basename(input_path),
      'requests' => requests.length,
      'responseTags' => response_tag_count,
      'dependencies' => dependencies.values.sum(&:length),
      'environments' => environments.length,
      'preRequestScripts' => pre_request_count,
      'warnings' => warnings.uniq
    }
  }

  template
end

options = {
  output: nil,
  summary: true
}

OptionParser.new do |opts|
  opts.banner = 'Usage: convert_insomnia.rb INPUT.yaml [--output OUTPUT.json]'
  opts.on('-o', '--output PATH', 'Write converted template JSON to PATH') { |path| options[:output] = path }
  opts.on('--no-summary', 'Do not print conversion summary') { options[:summary] = false }
end.parse!

input_path = ARGV.shift
abort('Missing input file.') unless input_path

template = convert(input_path)
json = JSON.pretty_generate(template)

if options[:output]
  File.write(options[:output], json)
else
  puts json
end

if options[:summary]
  summary = template['x-conversionSummary']
  warn JSON.pretty_generate(summary)
end
