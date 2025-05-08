import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Loader2, ExternalLink, Check, Clock, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function MyCampaignsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [reviewUrl, setReviewUrl] = useState("");
  const [activeApplicationId, setActiveApplicationId] = useState<number | null>(null);

  // 내 신청 내역 가져오기
  const { 
    data: applications = [], 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ["/api/applications/user"],
  });

  // 리뷰 제출 함수
  const submitReview = async (applicationId: number) => {
    if (!reviewUrl.trim()) {
      toast({
        title: "리뷰 URL이 필요합니다",
        description: "리뷰 URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`/api/applications/${applicationId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewUrl }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "리뷰 제출 중 오류가 발생했습니다.");
      }

      toast({
        title: "리뷰 제출 완료",
        description: "리뷰가 성공적으로 제출되었습니다. 포인트는 검토 후 지급됩니다.",
      });
      setReviewUrl("");
      setActiveApplicationId(null);
      refetch();
    } catch (error) {
      toast({
        title: "리뷰 제출 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 상태별 배지 렌더링
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "대기중":
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-600">대기중</Badge>;
      case "승인됨":
        return <Badge variant="outline" className="bg-green-50 text-green-600">승인됨</Badge>;
      case "거절됨":
        return <Badge variant="outline" className="bg-red-50 text-red-600">거절됨</Badge>;
      case "완료됨":
        return <Badge className="bg-primary text-white">완료됨</Badge>;
      default:
        return null;
    }
  };

  // 상태별 아이콘 렌더링
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "대기중":
        return <Clock className="h-5 w-5 text-neutral-600" />;
      case "승인됨":
        return <Check className="h-5 w-5 text-green-600" />;
      case "거절됨":
        return <X className="h-5 w-5 text-red-600" />;
      case "완료됨":
        return <Check className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  // 상태별 필터링
  const filteredApplications = applications.filter((app: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return app.status === "대기중";
    if (activeTab === "approved") return app.status === "승인됨";
    if (activeTab === "rejected") return app.status === "거절됨";
    if (activeTab === "completed") return app.status === "완료됨";
    return true;
  });

  if (isError) {
    toast({
      title: "데이터 로딩 오류",
      description: "신청 내역을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.",
      variant: "destructive",
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">내 체험 관리</h1>
              <p className="text-neutral-600">체험 신청 현황 및 진행 상태를 관리할 수 있습니다.</p>
            </div>
            <Link href="/">
              <Button className="mt-4 md:mt-0 rounded-full">
                새 체험 찾아보기
              </Button>
            </Link>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-5 md:w-auto w-full">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="pending">대기중</TabsTrigger>
              <TabsTrigger value="approved">승인됨</TabsTrigger>
              <TabsTrigger value="rejected">거절됨</TabsTrigger>
              <TabsTrigger value="completed">완료됨</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="pt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">신청 내역이 없습니다</h3>
                  <p className="text-neutral-600 max-w-md mx-auto mb-6">
                    {activeTab === "all" 
                      ? "아직 체험을 신청하지 않았습니다. 새로운 체험에 도전해보세요." 
                      : `${activeTab === "pending" ? "대기중인" : activeTab === "approved" ? "승인된" : activeTab === "rejected" ? "거절된" : "완료된"} 신청 내역이 없습니다.`}
                  </p>
                  <Link href="/">
                    <Button>체험 둘러보기</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((application: any) => (
                    <Card key={application.id} className="overflow-hidden">
                      <CardHeader className="p-4 md:p-6 flex flex-row justify-between items-center">
                        <div className="flex items-center gap-2">
                          {renderStatusIcon(application.status)}
                          <CardTitle className="text-base md:text-lg">{application.campaign.title}</CardTitle>
                          {renderStatusBadge(application.status)}
                        </div>
                        <div className="text-sm text-neutral-500">
                          신청일: {format(new Date(application.appliedAt), 'yyyy년 MM월 dd일', { locale: ko })}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-0">
                        <div className="p-4 md:p-6 pt-0 grid md:grid-cols-3 gap-4">
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={application.campaign.thumbnailUrl} 
                              alt={application.campaign.title} 
                              className="h-32 w-full object-cover"
                            />
                            <div className="p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{application.campaign.shopName}</span>
                                <Badge variant="secondary" className="text-xs">{application.campaign.category}</Badge>
                              </div>
                              <div className="text-xs text-neutral-500">{application.campaign.location}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium mb-1">신청 메시지</h4>
                              <p className="text-sm text-neutral-600 line-clamp-3">{application.message || "메시지 없음"}</p>
                            </div>
                            
                            {application.status === "거절됨" && (
                              <div>
                                <h4 className="text-sm font-medium text-red-600 mb-1">거절 사유</h4>
                                <p className="text-sm text-neutral-600">선택된 다른 인플루언서에게 기회가 주어졌습니다. 다음 기회에 다시 도전해보세요.</p>
                              </div>
                            )}
                            
                            {application.status === "완료됨" && application.pointsAwarded && (
                              <div>
                                <h4 className="text-sm font-medium text-primary mb-1">지급된 포인트</h4>
                                <p className="text-base font-bold">{application.pointsAwarded.toLocaleString()}P</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col justify-center">
                            <div className="flex justify-end space-x-2">
                              <Link href={`/campaigns/${application.campaignId}`}>
                                <Button variant="outline" size="sm" className="rounded-full">
                                  <ExternalLink className="h-4 w-4 mr-1" /> 캠페인 보기
                                </Button>
                              </Link>
                              
                              {application.status === "승인됨" && !application.reviewUrl && (
                                <Button 
                                  size="sm" 
                                  className="rounded-full"
                                  onClick={() => setActiveApplicationId(application.id)}
                                >
                                  리뷰 제출하기
                                </Button>
                              )}
                              
                              {application.reviewUrl && (
                                <a href={application.reviewUrl} target="_blank" rel="noopener noreferrer">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-full"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" /> 내 리뷰 보기
                                  </Button>
                                </a>
                              )}
                            </div>
                            
                            {activeApplicationId === application.id && (
                              <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                                <h4 className="text-sm font-medium mb-2">리뷰 URL 입력</h4>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="리뷰 URL을 입력하세요"
                                    value={reviewUrl}
                                    onChange={(e) => setReviewUrl(e.target.value)}
                                  />
                                  <Button 
                                    size="sm"
                                    onClick={() => submitReview(application.id)}
                                  >
                                    제출
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setActiveApplicationId(null);
                                      setReviewUrl("");
                                    }}
                                  >
                                    취소
                                  </Button>
                                </div>
                                <p className="text-xs text-neutral-500 mt-2">
                                  게시한 리뷰의 URL을 입력하세요. 블로그, 인스타그램 등 SNS 게시물 링크를 입력해주세요.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
