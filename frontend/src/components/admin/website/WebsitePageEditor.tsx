import { useEffect, useMemo, useState } from "react";
import { Copy, FileJson, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBaseClientProfile } from "@/lib/publicProfile";
import { getWebsitePageTemplate } from "@/lib/publicSiteContent";
import { notifySuccess } from "@/lib/notifications";

interface WebsitePageEditorProps {
  pageType: string;
  initialTitle: string;
  initialContent: string;
  onSave: (title: string, contentJson: string) => void;
  onClose: () => void;
}

export default function WebsitePageEditor({
  pageType,
  initialTitle,
  initialContent,
  onSave,
  onClose,
}: WebsitePageEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent !== "{}" ? initialContent : "");
  const [saving, setSaving] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const template = useMemo(
    () => getWebsitePageTemplate(pageType, getBaseClientProfile()),
    [pageType]
  );

  const templateJson = useMemo(
    () => JSON.stringify(template.sample, null, 2),
    [template.sample]
  );

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent !== "{}" ? initialContent : "");
  }, [initialTitle, initialContent]);

  const handleSave = async () => {
    const normalizedContent = content.trim();
    if (normalizedContent.length > 0) {
      try {
        JSON.parse(normalizedContent);
      } catch {
        setValidationMessage("Content must be valid JSON. Raw HTML blocks are no longer supported for public pages.");
        return;
      }
    }

    setValidationMessage("");
    setSaving(true);
    try {
      await onSave(title.trim() || template.title, normalizedContent.length > 0 ? normalizedContent : "{}");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyTemplate = async () => {
    await navigator.clipboard.writeText(templateJson);
    notifySuccess("Template JSON copied");
  };

  const handleResetToTemplate = () => {
    setContent(templateJson);
    setValidationMessage("");
    if (!title.trim()) {
      setTitle(template.title);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {template.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Content guidance</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{template.description}</p>
          </div>

          <div>
            <Label htmlFor="title">Page title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter page title"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label htmlFor="content">Page content JSON</Label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleCopyTemplate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Template
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleResetToTemplate}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                </div>
              </div>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter JSON content here"
                className="min-h-95 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              {validationMessage ? (
                <p className="mt-2 text-sm font-medium text-rose-600">{validationMessage}</p>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">Suggested schema</p>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  {templateJson}
                </pre>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Editing tips</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>Use JSON for structured editable sections.</li>
                  <li>Only supported page routes and structured JSON content should be published.</li>
                  <li>Keep key names unchanged so the public template can render your content correctly.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
