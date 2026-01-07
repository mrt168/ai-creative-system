'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, ImageIcon, Sparkles, Trash2, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { BannerGenerationDialog } from '@/components/banner-generation-dialog';
import { BannerDetailDialog } from '@/components/banner-detail-dialog';
import { PersonaDetailDialog } from '@/components/persona-detail-dialog';
import { StrategyForm } from '@/components/strategy-form';

interface Project {
  id: string;
  name: string;
  description: string | null;
  productName: string | null;
  productCategory: string | null;
  productUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Persona {
  id: string;
  name: string;
  ageRange: string | null;
  gender: string | null;
  occupation: string | null;
  interests: string[];
  painPoints: string[];
  buyingMotivation: string | null;
}

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

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [refreshingBanners, setRefreshingBanners] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, personasRes, bannersRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/personas`),
        fetch(`/api/projects/${id}/banners`),
      ]);

      const projectData = await projectRes.json();
      const personasData = await personasRes.json();
      const bannersData = await bannersRes.json();

      if (projectData.success) setProject(projectData.data);
      if (personasData.success) setPersonas(personasData.data);
      if (bannersData.success) setBanners(bannersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBanners = async () => {
    setRefreshingBanners(true);
    try {
      const response = await fetch(`/api/projects/${id}/banners`);
      const data = await response.json();
      if (data.success) setBanners(data.data);
    } catch (error) {
      console.error('Error refreshing banners:', error);
    } finally {
      setRefreshingBanners(false);
    }
  };

  const handleBannerDelete = (bannerId: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== bannerId));
  };

  const handlePersonaUpdate = (updatedPersona: Persona) => {
    setPersonas((prev) =>
      prev.map((p) => (p.id === updatedPersona.id ? updatedPersona : p))
    );
    setSelectedPersona(updatedPersona);
  };

  const handlePersonaDelete = (personaId: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== personaId));
  };

  const handleGeneratePersonas = async () => {
    if (!project?.productName || !project?.productCategory) {
      alert('商品名とカテゴリーを設定してください');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`/api/projects/${id}/personas/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo: {
            name: project.productName,
            category: project.productCategory,
            features: [],
            targetAge: '',
            targetGender: '',
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPersonas((prev) => [...prev, ...data.data.personas]);
      } else {
        alert(data.error || 'ペルソナの生成に失敗しました');
      }
    } catch (error) {
      console.error('Error generating personas:', error);
      alert('ペルソナの生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('このプロジェクトを削除しますか？')) return;

    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        router.push('/');
      } else {
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">プロジェクトが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={handleDeleteProject}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{personas.length}</p>
                  <p className="text-sm text-gray-500">ペルソナ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <ImageIcon className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{banners.length}</p>
                  <p className="text-sm text-gray-500">バナー</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Sparkles className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {banners.filter((b) => b.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-500">生成完了</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="strategy" className="space-y-4">
          <TabsList>
            <TabsTrigger value="strategy">戦略設計</TabsTrigger>
            <TabsTrigger value="personas">ペルソナ</TabsTrigger>
            <TabsTrigger value="banners">バナー</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy">
            <Card>
              <CardHeader>
                <CardTitle>戦略設計</CardTitle>
                <CardDescription>
                  ターゲットを定義し、訴求軸を選択してバナーを生成します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StrategyForm
                  projectId={id}
                  onComplete={(data) => {
                    console.log('Strategy completed:', data);
                  }}
                  onBannerGenerated={() => {
                    refreshBanners();
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personas">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>ペルソナ一覧</CardTitle>
                  <CardDescription>
                    ターゲットペルソナを管理します
                  </CardDescription>
                </div>
                <Button onClick={handleGeneratePersonas} disabled={generating}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generating ? 'AIで生成中...' : 'AIで生成'}
                </Button>
              </CardHeader>
              <CardContent>
                {personas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ペルソナがありません</p>
                    <p className="text-sm">AIを使って自動生成できます</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personas.map((persona) => (
                      <Card
                        key={persona.id}
                        className="border cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedPersona(persona)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{persona.name}</CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            {persona.ageRange && (
                              <Badge variant="secondary">{persona.ageRange}</Badge>
                            )}
                            {persona.gender && (
                              <Badge variant="secondary">{persona.gender}</Badge>
                            )}
                            {persona.occupation && (
                              <Badge variant="outline">{persona.occupation}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {persona.interests.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1">興味・関心</p>
                              <p className="text-sm">{persona.interests.join(', ')}</p>
                            </div>
                          )}
                          {persona.buyingMotivation && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">購買動機</p>
                              <p className="text-sm line-clamp-2">{persona.buyingMotivation}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>バナー一覧</CardTitle>
                  <CardDescription>
                    生成されたバナーを管理します
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={refreshBanners}
                    disabled={refreshingBanners}
                  >
                    {refreshingBanners ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    disabled={personas.length === 0}
                    onClick={() => setShowBannerDialog(true)}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    バナーを生成
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {banners.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>バナーがありません</p>
                    <p className="text-sm">ペルソナを作成してからバナーを生成してください</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {banners.map((banner) => (
                      <Card
                        key={banner.id}
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedBanner(banner)}
                      >
                        <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                          {banner.imagePath ? (
                            <img
                              src={banner.imagePath}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                          ) : banner.status === 'processing' ? (
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={
                                banner.status === 'completed'
                                  ? 'default'
                                  : banner.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className={
                                banner.status === 'completed'
                                  ? 'bg-green-500'
                                  : banner.status === 'processing'
                                  ? 'bg-blue-500'
                                  : undefined
                              }
                            >
                              {banner.status === 'completed'
                                ? '完了'
                                : banner.status === 'failed'
                                ? '失敗'
                                : banner.status === 'processing'
                                ? '処理中'
                                : '待機中'}
                            </Badge>
                            <span className="text-xs text-gray-500">{banner.aspectRatio}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BannerGenerationDialog
        open={showBannerDialog}
        onOpenChange={setShowBannerDialog}
        projectId={id}
        personas={personas}
        onSuccess={() => {
          setShowBannerDialog(false);
          fetchData();
        }}
      />

      <BannerDetailDialog
        open={!!selectedBanner}
        onOpenChange={(open) => !open && setSelectedBanner(null)}
        banner={selectedBanner}
        onDelete={handleBannerDelete}
      />

      <PersonaDetailDialog
        open={!!selectedPersona}
        onOpenChange={(open) => !open && setSelectedPersona(null)}
        persona={selectedPersona}
        onUpdate={handlePersonaUpdate}
        onDelete={handlePersonaDelete}
      />
    </div>
  );
}
