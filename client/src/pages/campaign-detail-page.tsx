import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CampaignDetail } from "@/components/ui/campaign-detail";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

interface CampaignDetailPageProps {
  id: string;
}

export default function CampaignDetailPage({ id }: CampaignDetailPageProps) {
  const { toast } = useToast();
  const campaignId = parseInt(id);

  // 캠페인 상세 정보 가져오기
  const { 
    data: campaign, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !isNaN(campaignId),
  });

  // 에러 처리
  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "데이터 로딩 오류",
        description: error.message || "캠페인 정보를 불러오는 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // ID가 유효하지 않은 경우
  if (isNaN(campaignId)) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-6 md:py-12 bg-neutral-50">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="ml-3 text-lg text-neutral-600">캠페인 정보를 불러오는 중...</span>
            </div>
          ) : campaign ? (
            <CampaignDetail campaign={campaign} />
          ) : (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-neutral-800 mb-4">캠페인을 찾을 수 없습니다</h2>
              <p className="text-neutral-600 mb-8">요청하신 캠페인이 존재하지 않거나 삭제되었습니다.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
