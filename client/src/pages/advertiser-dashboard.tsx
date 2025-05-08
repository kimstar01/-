import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, PlusCircle, Users, CheckCircle, AlertCircle, BarChart, DollarSign, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";

// 캠페인 생성 폼 스키마
const campaignSchema = z.object({
  title: z.string().min(5, "제목은 5자 이상이어야 합니다"),
  description: z.string().min(20, "설명은 20자 이상이어야 합니다"),
  thumbnailUrl: z.string().url("올바른 URL 형식이 아닙니다"),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  location: z.string().min(5, "위치는 5자 이상이어야 합니다"),
  shopName: z.string().min(2, "매장명은 2자 이상이어야 합니다"),
  capacity: z.coerce.number().min(1, "모집 인원은 1명 이상이어야 합니다"),
  benefit: z.string().min(10, "혜택 내용은 10자 이상이어야 합니다"),
  requirement: z.string().min(10, "참여 조건은 10자 이상이어야 합니다"),
  startDate: z.string().min(1, "시작일을 입력해주세요"),
  endDate: z.string().min(1, "종료일을 입력해주세요"),
  images: z.array(z.string().url("올바른 URL 형식이 아닙니다")).min(1, "최소 1개의 이미지가 필요합니다"),
});

// 포인트 지급 스키마
const pointsSchema = z.object({
  points: z.coerce.number().min(1000, "최소 1,000 포인트 이상 지급해야 합니다"),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;
type PointsFormValues = z.infer<typeof pointsSchema>;

type Application = {
  id: number;
  userId: number;
  status: string;
  message: string;
  appliedAt: string;
  reviewUrl: string | null;
  reviewSubmittedAt: string | null;
  pointsAwarded: number | null;
  user: {
    id: number;
    name: string;
    profileImage: string | null;
    followers: number;
    instagramId: string | null;
    blogUrl: string | null;
    twitterId: string | null;
  };
};

const categories = [
  '맛집', 
  '카페', 
  '뷰티', 
  '패션', 
  '가전', 
  '배달',
  '앱/웹서비스',
  '육아',
  '운동/건강',
  '기타'
];

export default function AdvertiserDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);

  // 내 캠페인 목록 가져오기
  const { 
    data: campaigns = [], 
    isLoading: campaignsLoading, 
    refetch: refetchCampaigns
  } = useQuery({
    queryKey: ["/api/advertiser/campaigns"],
  });

  // 선택한 캠페인의 신청자 목록 가져오기
  const { 
    data: applications = [], 
    isLoading: applicationsLoading,
    refetch: refetchApplications
  } = useQuery({
    queryKey: ["/api/applications/campaign", selectedCampaign],
    enabled: !!selectedCampaign,
  });

  // 캠페인 생성 폼
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnailUrl: "",
      category: "",
      location: "",
      shopName: "",
      capacity: 10,
      benefit: "",
      requirement: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      images: [""],
    },
  });

  // 포인트 지급 폼
  const pointsForm = useForm<PointsFormValues>({
    resolver: zodResolver(pointsSchema),
    defaultValues: {
      points: 10000,
    },
  });

  // 신청 상태 변경 뮤테이션
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/applications/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "상태 변경 완료",
        description: "신청자 상태가 변경되었습니다.",
      });
      refetchApplications();
    },
    onError: (error: Error) => {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 포인트 지급 뮤테이션
  const awardPointsMutation = useMutation({
    mutationFn: async ({ id, points }: { id: number, points: number }) => {
      const res = await apiRequest("POST", `/api/applications/${id}/award-points`, { points });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "포인트 지급 완료",
        description: "포인트가 성공적으로 지급되었습니다.",
      });
      setPointsDialogOpen(false);
      refetchApplications();
    },
    onError: (error: Error) => {
      toast({
        title: "포인트 지급 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 캠페인 생성 뮤테이션
  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormValues) => {
      const res = await apiRequest("POST", "/api/campaigns", {
        ...data,
        images: data.images.filter(url => url.trim() !== ""),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "캠페인 생성 완료",
        description: "새로운 캠페인이 성공적으로 등록되었습니다.",
      });
      form.reset();
      setImageUrls([""]);
      setActiveTab("campaigns");
      refetchCampaigns();
    },
    onError: (error: Error) => {
      toast({
        title: "캠페인 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 이미지 URL 필드 추가
  const addImageField = () => {
    setImageUrls([...imageUrls, ""]);
    form.setValue("images", [...form.getValues().images, ""]);
  };

  // 이미지 URL 필드 변경
  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    form.setValue("images", newUrls);
  };

  // 이미지 URL 필드 삭제
  const removeImageField = (index: number) => {
    if (imageUrls.length > 1) {
      const newUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newUrls);
      form.setValue("images", newUrls);
    }
  };

  // 캠페인 생성
  const onSubmit = (data: CampaignFormValues) => {
    // 이미지 빈 값 필터링
    const filteredImages = data.images.filter(url => url.trim() !== "");
    if (filteredImages.length === 0) {
      toast({
        title: "이미지 필요",
        description: "최소 1개의 이미지 URL이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    // 시작일과 종료일 검증
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate < startDate) {
      toast({
        title: "날짜 오류",
        description: "종료일은 시작일 이후여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      ...data,
      images: filteredImages,
    });
  };

  // 신청 상태 변경
  const handleStatusChange = (applicationId: number, status: string) => {
    updateApplicationStatusMutation.mutate({ id: applicationId, status });
  };

  // 포인트 지급
  const handleAwardPoints = (values: PointsFormValues) => {
    if (!selectedApplication) return;
    awardPointsMutation.mutate({ id: selectedApplication.id, points: values.points });
  };

  // 신청자 상세 정보 보기
  const viewApplicationDetails = (application: Application) => {
    setSelectedApplication(application);
    setApplicationDialogOpen(true);
  };

  // 포인트 지급 다이얼로그 열기
  const openPointsDialog = (application: Application) => {
    setSelectedApplication(application);
    setPointsDialogOpen(true);
  };

  // 캠페인 상태에 따른 배지 렌더링
  const renderCampaignStatusBadge = (campaign: any) => {
    const daysLeft = differenceInDays(new Date(campaign.endDate), new Date());
    
    if (daysLeft < 0) {
      return <Badge variant="outline" className="bg-neutral-100 text-neutral-600">마감됨</Badge>;
    } else if (daysLeft <= 3) {
      return <Badge className="bg-red-500 text-white">마감 임박</Badge>;
    } else if (differenceInDays(new Date(), new Date(campaign.createdAt)) <= 7) {
      return <Badge className="bg-secondary text-white">NEW</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-600">진행중</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">광고주 대시보드</h1>
              <p className="text-neutral-600">캠페인 관리 및 신청자를 확인할 수 있습니다.</p>
            </div>
          </div>
          
          <Tabs defaultValue="campaigns" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="mb-6">
              <TabsTrigger value="campaigns">내 캠페인</TabsTrigger>
              <TabsTrigger value="applications" disabled={!selectedCampaign}>신청자 관리</TabsTrigger>
              <TabsTrigger value="create">새 캠페인 등록</TabsTrigger>
            </TabsList>
            
            {/* 내 캠페인 탭 */}
            <TabsContent value="campaigns">
              {campaignsLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">등록된 캠페인이 없습니다</h3>
                  <p className="text-neutral-600 max-w-md mx-auto mb-6">
                    새로운 캠페인을 등록하고 인플루언서들과 함께 브랜드를 홍보해보세요.
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    새 캠페인 등록하기
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">전체 캠페인</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <BarChart className="h-8 w-8 text-primary mr-3" />
                          <div className="text-3xl font-bold">{campaigns.length}</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">총 신청자</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <Users className="h-8 w-8 text-secondary mr-3" />
                          <div className="text-3xl font-bold">
                            {campaigns.reduce((total, campaign) => total + campaign.applicantsCount, 0)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">완료된 체험</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                          <div className="text-3xl font-bold">
                            {campaigns.reduce((total, campaign) => total + campaign.completedCount, 0)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    {campaigns.map((campaign: any) => (
                      <Card key={campaign.id} className="overflow-hidden">
                        <div className="grid md:grid-cols-5 gap-4">
                          <div className="md:col-span-1">
                            <img 
                              src={campaign.thumbnailUrl} 
                              alt={campaign.title} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          
                          <div className="p-4 md:p-6 md:col-span-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  {renderCampaignStatusBadge(campaign)}
                                  <Badge variant="outline" className="bg-secondary/10 text-secondary">
                                    {campaign.category}
                                  </Badge>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                                <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                                  {campaign.description}
                                </p>
                              </div>
                              <div className="text-sm text-right">
                                <div className="flex items-center justify-end gap-1 mb-1">
                                  <Calendar className="h-4 w-4 text-neutral-500" />
                                  <span>
                                    {format(new Date(campaign.startDate), 'yyyy.MM.dd', { locale: ko })} ~ 
                                    {format(new Date(campaign.endDate), 'yyyy.MM.dd', { locale: ko })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                  <Users className="h-4 w-4 text-neutral-500" />
                                  <span>모집: {campaign.capacity}명 / 신청: {campaign.applicantsCount}명</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 mt-4">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-sm text-neutral-600">승인: {campaign.approvedCount}명</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span className="text-sm text-neutral-600">완료: {campaign.completedCount}명</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
                                <span className="text-sm text-neutral-600">
                                  조회수: {campaign.viewCount} / 좋아요: {campaign.likeCount}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex justify-end mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => window.open(`/campaigns/${campaign.id}`, '_blank')}
                              >
                                캠페인 보기
                              </Button>
                              <Button
                                size="sm"
                                className="ml-2 rounded-full"
                                onClick={() => {
                                  setSelectedCampaign(campaign.id);
                                  setActiveTab("applications");
                                }}
                              >
                                신청자 관리
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* 신청자 관리 탭 */}
            <TabsContent value="applications">
              {!selectedCampaign ? (
                <div className="text-center py-10">
                  <p>캠페인을 선택해주세요.</p>
                </div>
              ) : applicationsLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">신청자가 없습니다</h3>
                  <p className="text-neutral-600 max-w-md mx-auto mb-6">
                    아직 이 캠페인에 신청한 인플루언서가 없습니다.
                  </p>
                  <Button onClick={() => setActiveTab("campaigns")}>
                    다른 캠페인 보기
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">
                      {campaigns.find((c: any) => c.id === selectedCampaign)?.title} - 신청자 목록
                    </h3>
                    <Button variant="outline" onClick={() => setActiveTab("campaigns")}>
                      캠페인 목록으로 돌아가기
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applications.map((application: Application) => (
                      <Card key={application.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between">
                            <Badge
                              className={
                                application.status === "대기중"
                                  ? "bg-neutral-100 text-neutral-600"
                                  : application.status === "승인됨"
                                  ? "bg-green-50 text-green-600"
                                  : application.status === "거절됨"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-primary text-white"
                              }
                            >
                              {application.status}
                            </Badge>
                            <div className="text-xs text-neutral-500">
                              {format(new Date(application.appliedAt), 'yyyy년 MM월 dd일', { locale: ko })}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-100">
                              {application.user.profileImage ? (
                                <img 
                                  src={application.user.profileImage} 
                                  alt={application.user.name} 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                  {application.user.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-base">{application.user.name}</CardTitle>
                              <div className="flex items-center text-xs text-neutral-500 mt-1">
                                <Users className="h-3 w-3 mr-1" />
                                팔로워: {application.user.followers.toLocaleString()}명
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pb-3">
                          <div className="space-y-2">
                            {application.user.instagramId && (
                              <div className="flex items-center text-sm">
                                <span className="font-medium w-20">인스타그램:</span>
                                <a 
                                  href={`https://instagram.com/${application.user.instagramId}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline truncate"
                                >
                                  @{application.user.instagramId}
                                </a>
                              </div>
                            )}
                            
                            {application.user.blogUrl && (
                              <div className="flex items-center text-sm">
                                <span className="font-medium w-20">블로그:</span>
                                <a 
                                  href={application.user.blogUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline truncate"
                                >
                                  {application.user.blogUrl.replace(/^https?:\/\//, '')}
                                </a>
                              </div>
                            )}
                            
                            {application.reviewUrl && (
                              <div className="flex items-center text-sm">
                                <span className="font-medium w-20">리뷰:</span>
                                <a 
                                  href={application.reviewUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline truncate"
                                >
                                  보기
                                </a>
                              </div>
                            )}
                            
                            {application.pointsAwarded && (
                              <div className="flex items-center text-sm">
                                <span className="font-medium w-20">지급 포인트:</span>
                                <span className="font-bold text-primary">{application.pointsAwarded.toLocaleString()}P</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <div className="text-sm font-medium mb-1">신청 메시지:</div>
                            <p className="text-sm text-neutral-600 line-clamp-3">{application.message || "메시지 없음"}</p>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="pt-0">
                          <div className="w-full space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => viewApplicationDetails(application)}
                            >
                              상세 정보
                            </Button>
                            
                            {application.status === "대기중" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleStatusChange(application.id, "승인됨")}
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleStatusChange(application.id, "거절됨")}
                                >
                                  거절
                                </Button>
                              </div>
                            )}
                            
                            {application.status === "승인됨" && application.reviewUrl && !application.pointsAwarded && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => openPointsDialog(application)}
                              >
                                <DollarSign className="h-4 w-4 mr-1" /> 포인트 지급
                              </Button>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* 새 캠페인 등록 탭 */}
            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>새 캠페인 등록</CardTitle>
                  <CardDescription>
                    인플루언서들에게 홍보할 새로운 캠페인 정보를 입력해주세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>캠페인 제목</FormLabel>
                              <FormControl>
                                <Input placeholder="예: 신규 오픈 뉴욕 감성 브런치 카페" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>카테고리</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="카테고리 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shopName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>매장명/브랜드명</FormLabel>
                              <FormControl>
                                <Input placeholder="예: 카페 브루클린" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>위치</FormLabel>
                              <FormControl>
                                <Input placeholder="예: 서울 강남구 역삼동 123-45" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>모집 인원</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>시작일</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>종료일</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="thumbnailUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>썸네일 이미지 URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormDescription>
                              캠페인 목록에 표시될 대표 이미지 URL을 입력하세요.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <FormLabel>상세 이미지 URL</FormLabel>
                        {imageUrls.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 mt-2">
                            <Input
                              placeholder={`이미지 URL ${index + 1}`}
                              value={url}
                              onChange={(e) => handleImageUrlChange(index, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeImageField(index)}
                              disabled={imageUrls.length <= 1}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={addImageField}
                        >
                          이미지 추가
                        </Button>
                        {form.formState.errors.images && (
                          <p className="text-sm font-medium text-destructive mt-2">
                            {form.formState.errors.images.message}
                          </p>
                        )}
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="benefit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>체험 혜택</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="예: 
- 시그니처 브런치 2인 세트 무료 제공 (가격: 58,000원)
- 스페셜티 커피 2잔 포함
- 디저트 플래터 제공
- 체험 후 포인트 20,000P 지급"
                                rows={5}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              각 혜택을 줄바꿈으로 구분해주세요.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="requirement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>체험 조건</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="예:
- 인스타그램 팔로워 1,000명 이상
- 방문 후 48시간 내 인스타그램 피드 게시물 1회 업로드
- 게시물에 @브랜드계정 태그 및 #해시태그 포함
- 사진 10장 이상, 글자수 300자 이상 리뷰 작성"
                                rows={5}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              각 조건을 줄바꿈으로 구분해주세요.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>캠페인 상세 설명</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="캠페인에 대한 상세 설명을 입력하세요."
                                rows={8}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("campaigns")}
                        >
                          취소
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCampaignMutation.isPending}
                        >
                          {createCampaignMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              등록 중...
                            </>
                          ) : (
                            "캠페인 등록하기"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* 신청자 상세 정보 다이얼로그 */}
      <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>신청자 상세 정보</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-100">
                  {selectedApplication.user.profileImage ? (
                    <img 
                      src={selectedApplication.user.profileImage} 
                      alt={selectedApplication.user.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                      {selectedApplication.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedApplication.user.name}</h3>
                  <div className="flex items-center text-sm text-neutral-500">
                    <Users className="h-4 w-4 mr-1" />
                    팔로워: {selectedApplication.user.followers.toLocaleString()}명
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">상태:</div>
                <Badge
                  className={
                    selectedApplication.status === "대기중"
                      ? "bg-neutral-100 text-neutral-600"
                      : selectedApplication.status === "승인됨"
                      ? "bg-green-50 text-green-600"
                      : selectedApplication.status === "거절됨"
                      ? "bg-red-50 text-red-600"
                      : "bg-primary text-white"
                  }
                >
                  {selectedApplication.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">신청일:</div>
                <div>{format(new Date(selectedApplication.appliedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">SNS 정보:</div>
                <div className="space-y-1 text-sm">
                  {selectedApplication.user.instagramId && (
                    <div className="flex items-center">
                      <span className="font-medium w-20">인스타그램:</span>
                      <a 
                        href={`https://instagram.com/${selectedApplication.user.instagramId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        @{selectedApplication.user.instagramId}
                      </a>
                    </div>
                  )}
                  
                  {selectedApplication.user.blogUrl && (
                    <div className="flex items-center">
                      <span className="font-medium w-20">블로그:</span>
                      <a 
                        href={selectedApplication.user.blogUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {selectedApplication.user.blogUrl.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  
                  {selectedApplication.user.twitterId && (
                    <div className="flex items-center">
                      <span className="font-medium w-20">트위터:</span>
                      <a 
                        href={`https://twitter.com/${selectedApplication.user.twitterId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        @{selectedApplication.user.twitterId}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">신청 메시지:</div>
                <div className="p-3 bg-neutral-50 rounded-md text-sm whitespace-pre-line">
                  {selectedApplication.message || "메시지 없음"}
                </div>
              </div>
              
              {selectedApplication.reviewUrl && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">리뷰 URL:</div>
                  <div>
                    <a 
                      href={selectedApplication.reviewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {selectedApplication.reviewUrl}
                    </a>
                  </div>
                  <div className="text-xs text-neutral-500">
                    제출일: {selectedApplication.reviewSubmittedAt 
                      ? format(new Date(selectedApplication.reviewSubmittedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
                      : '-'}
                  </div>
                </div>
              )}
              
              {selectedApplication.pointsAwarded && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">지급된 포인트:</div>
                  <div className="text-lg font-bold text-primary">
                    {selectedApplication.pointsAwarded.toLocaleString()}P
                  </div>
                </div>
              )}
              
              <DialogFooter className="gap-2 sm:gap-0">
                {selectedApplication.status === "대기중" && (
                  <div className="flex w-full gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleStatusChange(selectedApplication.id, "승인됨");
                        setApplicationDialogOpen(false);
                      }}
                    >
                      승인하기
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleStatusChange(selectedApplication.id, "거절됨");
                        setApplicationDialogOpen(false);
                      }}
                    >
                      거절하기
                    </Button>
                  </div>
                )}
                
                {selectedApplication.status === "승인됨" && selectedApplication.reviewUrl && !selectedApplication.pointsAwarded && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setApplicationDialogOpen(false);
                      setPointsDialogOpen(true);
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-1" /> 포인트 지급하기
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 포인트 지급 다이얼로그 */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>포인트 지급</DialogTitle>
            <DialogDescription>
              리뷰를 완료한 인플루언서에게 지급할 포인트를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...pointsForm}>
            <form onSubmit={pointsForm.handleSubmit(handleAwardPoints)} className="space-y-4">
              <FormField
                control={pointsForm.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>포인트</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min="1000" step="1000" />
                    </FormControl>
                    <FormDescription>
                      리뷰 품질에 따라 적절한 포인트를 지급하세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={awardPointsMutation.isPending}>
                  {awardPointsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "포인트 지급하기"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
