'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, Trash2, Copy, CheckCircle } from 'lucide-react';

interface Banner {
  id: string;
  prompt: string;
  imagePath: string | null;
  aspectRatio: string;
  size: string;
  status: string;
  createdAt: string;
  errorMessage?: string | null;
}

interface BannerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
  onDelete: (id: string) => void;
}

export function BannerDetailDialog({
  open,
  onOpenChange,
  banner,
  onDelete,
}: BannerDetailDialogProps) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!banner) return null;

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(banner.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('このバナーを削除しますか？')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/banners/${banner.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        onDelete(banner.id);
        onOpenChange(false);
      } else {
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!banner.imagePath) return;

    const link = document.createElement('a');
    link.href = banner.imagePath;
    link.download = `banner-${banner.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = () => {
    switch (banner.status) {
      case 'completed':
        return <Badge className="bg-green-500">完了</Badge>;
      case 'failed':
        return <Badge variant="destructive">失敗</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">処理中</Badge>;
      default:
        return <Badge variant="secondary">待機中</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            バナー詳細
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            {new Date(banner.createdAt).toLocaleString('ja-JP')}に作成
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {banner.imagePath ? (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={banner.imagePath}
                alt="Generated banner"
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <p className="text-gray-500">
                {banner.status === 'failed'
                  ? '画像の生成に失敗しました'
                  : '画像を生成中...'}
              </p>
            </div>
          )}

          {banner.errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{banner.errorMessage}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">プロンプト</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPrompt}
                className="h-8"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    コピー
                  </>
                )}
              </Button>
            </div>
            <div className="bg-gray-50 rounded-md p-3 max-h-[100px] overflow-y-auto">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {banner.prompt}
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-500">アスペクト比: </span>
              <span className="font-medium">{banner.aspectRatio}</span>
            </div>
            <div>
              <span className="text-gray-500">サイズ: </span>
              <span className="font-medium">{banner.size}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? '削除中...' : '削除'}
          </Button>
          <div className="flex gap-2">
            {banner.imagePath && (
              <>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  ダウンロード
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(banner.imagePath!, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  新しいタブで開く
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
