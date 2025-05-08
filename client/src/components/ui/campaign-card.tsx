import { Link } from "wouter";
import { Campaign } from "@shared/schema";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

interface CampaignCardProps {
  campaign: Campaign & { applicantsCount: number };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  // 남은 기간 계산
  const daysLeft = differenceInDays(new Date(campaign.endDate), new Date());
  
  // 마감 임박 (3일 이하)
  const isUrgent = daysLeft <= 3 && daysLeft >= 0;
  
  // 신규 캠페인 (7일 이내 등록)
  const isNew = differenceInDays(new Date(), new Date(campaign.createdAt)) <= 7;
  
  // 금액이 높은 캠페인 (임의로 설정)
  const isHighReward = campaign.benefit.includes("30,000P") || 
                      campaign.benefit.includes("50,000P") || 
                      campaign.benefit.includes("100,000P");

  return (
    <Link to={`/campaigns/${campaign.id}`}>
      <Card className="overflow-hidden shadow-md transition-all duration-300 card-hover">
        <div className="relative">
          <img 
            src={campaign.thumbnailUrl} 
            alt={campaign.title} 
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1542435503-956c469947f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80";
              e.currentTarget.onerror = null;
            }}
          />
          {isUrgent && (
            <span className="absolute top-3 left-3 bg-primary text-white text-xs font-medium px-2 py-1 rounded">
              마감 임박
            </span>
          )}
          {isNew && !isUrgent && (
            <span className="absolute top-3 left-3 bg-secondary text-white text-xs font-medium px-2 py-1 rounded">
              NEW
            </span>
          )}
          {isHighReward && !isUrgent && !isNew && (
            <span className="absolute top-3 left-3 bg-secondary text-white text-xs font-medium px-2 py-1 rounded">
              고수익
            </span>
          )}
          <span className="absolute top-3 right-3 bg-white/90 text-neutral-800 text-xs font-medium px-2 py-1 rounded flex items-center">
            <i className="ri-map-pin-line mr-1"></i> {campaign.location}
          </span>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">
              {campaign.category}
            </Badge>
            <div className="flex items-center text-neutral-500 text-sm">
              <Heart className="w-4 h-4 mr-1" />
              {campaign.likeCount}
            </div>
          </div>

          <h3 className="font-bold text-lg mb-2 line-clamp-1">{campaign.title}</h3>
          <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{campaign.description}</p>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <span className="text-neutral-600">모집</span>
              <span className="font-bold text-neutral-800 ml-1">{campaign.capacity}명</span>
            </div>
            <div className="flex items-center">
              <span className="text-neutral-600">신청</span>
              <span className="font-bold text-neutral-800 ml-1">{campaign.applicantsCount}명</span>
            </div>
            <div className="flex items-center">
              <span className="text-neutral-600">남은기간</span>
              {daysLeft < 0 ? (
                <span className="font-bold text-neutral-400 ml-1">마감</span>
              ) : daysLeft <= 3 ? (
                <span className="font-bold text-primary ml-1">{daysLeft}일</span>
              ) : (
                <span className="font-bold text-neutral-800 ml-1">{daysLeft}일</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
