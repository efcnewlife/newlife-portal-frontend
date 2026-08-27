import { describe, expect, it } from "vitest";
import { buildLegalDocumentMarkdownEditorLabels } from "./legalDocumentMarkdownEditorLabels";

describe("buildLegalDocumentMarkdownEditorLabels", () => {
  it("maps content i18n keys onto MarkdownEditor chrome labels", () => {
    const t = (key: string) => `t:${key}`;

    expect(buildLegalDocumentMarkdownEditorLabels(t)).toEqual({
      modeEdit: "t:legalDocument.markdownEditor.modeEdit",
      modeSource: "t:legalDocument.markdownEditor.modeSource",
      modePreview: "t:legalDocument.markdownEditor.modePreview",
      modeGroup: "t:legalDocument.markdownEditor.modeGroup",
      toolbar: "t:legalDocument.markdownEditor.toolbar",
      editor: "t:legalDocument.markdownEditor.editor",
      heading: "t:legalDocument.markdownEditor.heading",
      paragraph: "t:legalDocument.markdownEditor.paragraph",
      heading1: "t:legalDocument.markdownEditor.heading1",
      heading2: "t:legalDocument.markdownEditor.heading2",
      heading3: "t:legalDocument.markdownEditor.heading3",
      heading4: "t:legalDocument.markdownEditor.heading4",
      heading5: "t:legalDocument.markdownEditor.heading5",
      heading6: "t:legalDocument.markdownEditor.heading6",
      bold: "t:legalDocument.markdownEditor.bold",
      italic: "t:legalDocument.markdownEditor.italic",
      strike: "t:legalDocument.markdownEditor.strike",
      link: "t:legalDocument.markdownEditor.link",
      orderedList: "t:legalDocument.markdownEditor.orderedList",
      unorderedList: "t:legalDocument.markdownEditor.unorderedList",
      blockquote: "t:legalDocument.markdownEditor.blockquote",
      code: "t:legalDocument.markdownEditor.code",
      linkPrompt: "t:legalDocument.markdownEditor.linkPrompt",
    });
  });
});
