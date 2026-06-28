import { useState, useRef, useEffect } from 'react';
import { FileUp, Play, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { notifyUpload } from '@/lib/notifications';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDatabases } from '@/hooks/useDatabases';
import { useUploadDump, useImportDump, useDeleteDump } from '@/hooks/useDumpUpload';
import { useDatabaseStore } from '@/stores/databaseStore';
import { emitImportStart, onImportProgress } from '@/lib/socket';
import { formatBytes } from '@/lib/utils';
import { DatabaseInfo } from '@/types';

interface UploadFile {
  fileId: string;
  filename: string;
  size: number;
  path: string;
  status: 'uploading' | 'uploaded' | 'importing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export default function DumpPage() {
  const { currentDatabase } = useDatabaseStore();
  const { data: databases = [] } = useDatabases();
  const uploadDump = useUploadDump();
  const importDump = useImportDump();
  const deleteDump = useDeleteDump();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedDb, setSelectedDb] = useState(currentDatabase ?? '');

  useEffect(() => {
    const unsubscribe = onImportProgress((data) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.fileId === data.fileId
            ? { ...f, progress: data.percent, status: 'importing' }
            : f
        )
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempFile: UploadFile = {
      fileId: '',
      filename: file.name,
      size: file.size,
      path: '',
      status: 'uploading',
      progress: 0,
    };

    setFiles((prev) => [...prev, tempFile]);

    try {
      const responseData = await uploadDump.mutateAsync({
        file,
        database: selectedDb || undefined,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.filename === file.name
            ? { ...f, fileId: responseData.fileId, status: 'uploaded', progress: 100 }
            : f
        )
      );
      notifyUpload(`Uploaded ${file.name}`, 'success');
    } catch {
      notifyUpload(`Upload failed: ${file.name}`, 'error');
      setFiles((prev) =>
        prev.map((f) =>
          f.filename === file.name ? { ...f, status: 'error', error: 'Upload failed' } : f
        )
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async (fileId: string) => {
    if (!selectedDb) {
      toast.error('Please select a database first');
      return;
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.fileId === fileId ? { ...f, status: 'importing', progress: 0 } : f
      )
    );

    try {
      emitImportStart(fileId, selectedDb);
      await importDump.mutateAsync({ fileId, database: selectedDb });

      setFiles((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, status: 'complete', progress: 100 } : f
        )
      );
      notifyUpload('Import completed', 'success');
    } catch {
      notifyUpload('Import failed', 'error');
      setFiles((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, status: 'error', error: 'Import failed' } : f
        )
      );
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!fileId) return;
    try {
      await deleteDump.mutateAsync(fileId);
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
      toast.success('File deleted');
    } catch {
      // toast handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Dump Import
          </CardTitle>
          <CardDescription>
            Upload and import SQL dump files to your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={selectedDb || currentDatabase || ''}
              onValueChange={setSelectedDb}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select database" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db: DatabaseInfo) => (
                  <SelectItem key={db.name} value={db.name}>
                    {db.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.gz"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploadDump.isPending ? (
              <div className="space-y-2">
                <Loader className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
                <Progress value={50} className="w-64 mx-auto" />
              </div>
            ) : (
              <div className="space-y-2">
                <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Click to select SQL dump file</p>
                <p className="text-xs text-muted-foreground">
                  Supports .sql and .sql.gz files up to 10GB
                </p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded Files</p>
              {files.map((file) => (
                <div
                  key={file.fileId || file.filename}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-3">
                    {file.status === 'uploading' || file.status === 'importing' ? (
                      <Loader className="h-5 w-5 animate-spin text-primary" />
                    ) : file.status === 'complete' ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : file.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <FileUp className="h-5 w-5" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                      {file.error && (
                        <p className="text-xs text-destructive">{file.error}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'importing' && (
                      <Progress value={file.progress} className="w-24" />
                    )}
                    {(file.status === 'uploaded' || file.status === 'error') && (
                      <Button
                        size="sm"
                        onClick={() => handleImport(file.fileId)}
                        disabled={!selectedDb || importDump.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Import
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(file.fileId)}
                      disabled={!file.fileId || deleteDump.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
