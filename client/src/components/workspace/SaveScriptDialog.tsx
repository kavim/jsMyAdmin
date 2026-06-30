import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useScripts } from '@/hooks/useScripts';
import { collectFolders } from '@/components/explorer/ScriptsTree';

interface SaveScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolder?: string;
  defaultName?: string;
  onSave: (fullPath: string) => void;
}

export default function SaveScriptDialog({
  open,
  onOpenChange,
  defaultFolder = '',
  defaultName = '',
  onSave,
}: SaveScriptDialogProps) {
  const { data: tree = [] } = useScripts();
  const folders = ['', ...collectFolders(tree)];

  const [folder, setFolder] = useState(defaultFolder);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) {
      setFolder(defaultFolder);
      setName(defaultName);
    }
  }, [open, defaultFolder, defaultName]);

  const handleSave = () => {
    let fileName = name.trim();
    if (!fileName) return;
    if (!fileName.endsWith('.sql')) fileName += '.sql';

    const fullPath = folder ? `${folder}/${fileName}` : fileName;
    onSave(fullPath);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save SQL script</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="script-folder">Folder</Label>
            <Select value={folder || '__root__'} onValueChange={(v) => setFolder(v === '__root__' ? '' : v)}>
              <SelectTrigger id="script-folder">
                <SelectValue placeholder="Root (data/scripts/)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">/ (root)</SelectItem>
                {folders.filter(Boolean).map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}/
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="script-name">File name</Label>
            <Input
              id="script-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-query.sql"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
