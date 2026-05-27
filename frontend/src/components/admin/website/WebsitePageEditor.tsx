import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent !== "{}" ? initialContent : "");
  }, [initialTitle, initialContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(title, content);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {pageType.charAt(0).toUpperCase() + pageType.slice(1)} Page</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter page title"
            />
          </div>

          <div>
            <Label htmlFor="content">Page Content</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter page content or HTML here"
              className="min-h-75 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
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