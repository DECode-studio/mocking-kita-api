// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpenApiModal } from '@/src/client/presentation/views/project-detail/components/OpenApiModal';
import { PROJECT_DETAIL_SEMANTIC_ID, PROJECT_DETAIL_TEXT } from '@/src/client/presentation/views/project-detail/constant';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/src/core/di', () => ({
  getService: vi.fn(() => ({
    exportOpenApi: vi.fn(),
    importOpenApi: vi.fn(),
  })),
  CLIENT_DI_TOKENS: {
    projectUseCase: Symbol('projectUseCase'),
  },
}));

describe('OpenApiModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders download template md button to the left of file input on confluence_markdown format', () => {
    render(
      <OpenApiModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="project-123"
        projectName="Test Project"
      />
    );

    // Switch to Import Spec tab
    const importTab = screen.getByRole('button', { name: new RegExp(PROJECT_DETAIL_TEXT.OPENAPI_TAB_IMPORT, 'i') });
    fireEvent.click(importTab);

    // Initially in openapi format, template download button should not be rendered
    expect(screen.queryByText(PROJECT_DETAIL_TEXT.OPENAPI_DOWNLOAD_TEMPLATE_MD_BTN)).toBeNull();

    // Switch to Confluence Spec (Markdown .md)
    const mdFormatBtn = document.getElementById(PROJECT_DETAIL_SEMANTIC_ID.OPENAPI_FORMAT_BTN('confluence_markdown'));
    expect(mdFormatBtn).not.toBeNull();
    fireEvent.click(mdFormatBtn!);

    // Now the Download Template MD button should be visible
    const downloadBtn = document.getElementById(PROJECT_DETAIL_SEMANTIC_ID.OPENAPI_DOWNLOAD_TEMPLATE_MD_BTN);
    expect(downloadBtn).not.toBeNull();
    expect(downloadBtn?.textContent).toContain(PROJECT_DETAIL_TEXT.OPENAPI_DOWNLOAD_TEMPLATE_MD_BTN);

    // Verify it is placed immediately to the left of the file input in the DOM
    const fileInput = document.getElementById(PROJECT_DETAIL_SEMANTIC_ID.OPENAPI_FILE_INPUT);
    expect(fileInput).not.toBeNull();
    expect(downloadBtn?.nextElementSibling).toBe(fileInput);
  });
});

