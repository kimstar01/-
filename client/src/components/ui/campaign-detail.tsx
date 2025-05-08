import { useState } from "react";
import { Campaign } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { ImageGallery } from "@/components/ui/image-gallery";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { differenceInDays, format } from "date-fns";
import { ko } from "date-fns/locale";

interface CampaignDetailProps {
  campaign: Campaign & { 
    applicantsCount: number;
    isLiked?: boolean;
  };
}

export function CampaignDetail({ campaign }: CampaignDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isLiked, setIsLiked] = useState(campaign.isLiked || false);
  
  // 남은 기간 계산
  const daysLeft = differenceInDays(new Date(campaign.endDate), new Date());
  const isUrgent = daysLeft <= 3 && daysLeft >= 0;
  const isExpired = daysLeft < 0;
  
  // 체험 신청 뮤테이션
  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/applications", {
        campaignId: campaign.id,
        message: applicationMessage
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "신청 완료",
        description: "체험 신청이 접수되었습니다. 승인 결과는 알림으로 안내됩니다.",
      });
      setIsApplyModalOpen(false);
      setApplicationMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaign.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "신청 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // 좋아요 뮤테이션
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/campaigns/${campaign.id}/like`);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaign.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleApply = () => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "체험 신청을 위해 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (user.role !== 'influencer') {
      toast({
        title: "권한 없음",
        description: "인플루언서만 체험 신청이 가능합니다.",
        variant: "destructive",
      });
      return;
    }
    
    setIsApplyModalOpen(true);
  };
  
  const handleLike = () => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "좋아요 기능을 사용하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }
    
    likeMutation.mutate();
  };
  
  const handleSubmitApplication = () => {
    if (!applicationMessage.trim()) {
      toast({
        title: "신청 내용 필요",
        description: "신청 메시지를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    applyMutation.mutate();
  };
  
  // 혜택과 조건을 배열로 변환
  const benefitItems = campaign.benefit.split('\n').filter(item => item.trim());
  const requirementItems = campaign.requirement.split('\n').filter(item => item.trim());
  
  return (
    <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <ImageGallery images={campaign.images} />
          </div>
          
          <div className="md:w-1/2">
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                {campaign.category}
              </Badge>
              {isUrgent && (
                <Badge variant="destructive" className="bg-primary/10 text-primary">
                  마감 임박
                </Badge>
              )}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{campaign.title}</h2>
            
            <div className="flex items-center text-sm text-neutral-600 mb-4">
              <div className="flex items-center mr-3">
                <i className="ri-map-pin-line mr-1"></i> {campaign.location}
              </div>
              <div className="flex items-center cursor-pointer hover:text-primary" onClick={handleLike}>
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-primary text-primary' : ''}`} />
                {campaign.likeCount}명이 찜했어요
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-neutral-600 text-sm">모집인원</p>
                  <p className="font-bold text-lg">{campaign.capacity}명</p>
                </div>
                <div>
                  <p className="text-neutral-600 text-sm">신청인원</p>
                  <p className="font-bold text-lg">{campaign.applicantsCount}명</p>
                </div>
                <div>
                  <p className="text-neutral-600 text-sm">남은기간</p>
                  {isExpired ? (
                    <p className="font-bold text-lg text-neutral-400">마감</p>
                  ) : isUrgent ? (
                    <p className="font-bold text-lg text-primary">{daysLeft}일</p>
                  ) : (
                    <p className="font-bold text-lg">{daysLeft}일</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">체험 혜택</h3>
              <ul className="space-y-2">
                {benefitItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <i className="ri-check-line text-primary mt-1 mr-2"></i>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">체험 조건</h3>
              <ul className="space-y-2">
                {requirementItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <i className="ri-information-line text-secondary mt-1 mr-2"></i>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Button 
              className="w-full font-medium py-3 rounded-full"
              variant={isExpired ? "outline" : "default"}
              disabled={isExpired || applyMutation.isPending}
              onClick={handleApply}
            >
              {isExpired ? "모집 마감된 캠페인입니다" : "체험 신청하기"}
            </Button>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-6">
          <h3 className="font-bold text-xl mb-4">체험 상세 정보</h3>
          <div className="prose max-w-none">
            <p className="mb-4 whitespace-pre-line">{campaign.description}</p>
            
            <h4 className="font-bold text-lg mt-6 mb-2">체험 일정</h4>
            <p className="mb-2">
              - 신청 기간: {format(new Date(campaign.startDate), 'yyyy년 MM월 dd일', { locale: ko })} ~ {format(new Date(campaign.endDate), 'yyyy년 MM월 dd일', { locale: ko })}<br />
              - 리뷰 작성 기한: 체험 후 48시간 이내
            </p>
            
            <h4 className="font-bold text-lg mt-6 mb-2">방문 안내</h4>
            <p className="mb-4">
              - 주소: {campaign.location}<br />
              - 매장명: {campaign.shopName}
            </p>
          </div>
        </div>
      </div>
      
      {/* 신청 모달 */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>체험 신청하기</DialogTitle>
            <DialogDescription>
              캠페인 주최자에게 전달될 내용입니다. 성의있게 작성해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">신청 내용</h4>
              <Textarea
                placeholder="본인의 SNS 계정 정보와 함께 간략한 자기소개, 참여 의사를 남겨주세요."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button" 
              variant="outline"
              onClick={() => setIsApplyModalOpen(false)}
            >
              취소
            </Button>
            <Button 
              type="button"
              disabled={applyMutation.isPending}
              onClick={handleSubmitApplication}
            >
              {applyMutation.isPending ? "신청 중..." : "신청하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
