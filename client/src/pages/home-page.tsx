import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CampaignCard } from "@/components/ui/campaign-card";
import { CategoryFilter } from "@/components/ui/category-filter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight, Search, Edit, Coins } from "lucide-react";
import { Link } from "wouter";

const categories = [
  '전체', 
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

export default function HomePage() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('전체');
  
  // 캠페인 목록 가져오기
  const { 
    data: campaigns = [], 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/campaigns', selectedCategory],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?category=${selectedCategory}`);
      if (!res.ok) {
        throw new Error('캠페인 목록을 불러오는 데 실패했습니다.');
      }
      return res.json();
    }
  });

  // 인기 캠페인과 신규 캠페인 분류
  const popularCampaigns = [...campaigns]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 4);
  
  const newCampaigns = [...campaigns]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  
  // 에러 처리
  useEffect(() => {
    if (isError) {
      toast({
        title: "데이터 로딩 오류",
        description: "캠페인 목록을 불러오는 중 문제가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  return (
    <div>
      <Header />

      {/* 히어로 배너 */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light opacity-90"
             style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=500&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'multiply' }}>
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="md:w-2/3">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">새로운 체험, 새로운 혜택</h1>
            <p className="text-lg md:text-xl text-white opacity-90 mb-8">신상품과 서비스를 무료로 체험하고 소정의 수익도 얻어보세요!</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-neutral-100 rounded-full">
                  체험단 신청하기
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 rounded-full">
                  광고주 등록하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* 카테고리 필터 */}
      <CategoryFilter 
        categories={categories} 
        selectedCategory={selectedCategory} 
        onSelectCategory={handleCategorySelect} 
      />
      
      {/* 인기 체험 */}
      <section className="py-10 md:py-16" id="popular">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">인기 체험</h2>
            <Link href={`/explore?category=${selectedCategory}`} className="text-neutral-600 hover:text-primary flex items-center">
              더보기 <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : popularCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">해당 카테고리에 체험이 없습니다</h3>
              <p className="text-neutral-500 max-w-md mb-6">아직 등록된 체험이 없어요. 다른 카테고리를 선택하거나 나중에 다시 확인해주세요.</p>
              <Button onClick={() => setSelectedCategory('전체')}>전체 체험 보기</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* 신규 체험 */}
      <section className="py-10 md:py-16 bg-neutral-50" id="new">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">신규 체험</h2>
            <Link href="/explore" className="text-neutral-600 hover:text-primary flex items-center">
              더보기 <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : newCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">해당 카테고리에 체험이 없습니다</h3>
              <p className="text-neutral-500 max-w-md mb-6">아직 등록된 체험이 없어요. 다른 카테고리를 선택하거나 나중에 다시 확인해주세요.</p>
              <Button onClick={() => setSelectedCategory('전체')}>전체 체험 보기</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {newCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* 이용방법 안내 */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">체험단 참여 방법</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">간단한 단계를 통해 여러분이 원하는 제품과 서비스를 무료로 체험하고 소정의 수익까지 얻을 수 있습니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
                <User className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">1. 회원가입</h3>
              <p className="text-neutral-600 text-sm">SNS 계정으로 간편하게 가입하고 프로필을 완성해주세요.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">2. 체험 선택</h3>
              <p className="text-neutral-600 text-sm">관심있는 카테고리에서 참여하고 싶은 체험을 찾아보세요.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
                <Edit className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">3. 체험 및 리뷰</h3>
              <p className="text-neutral-600 text-sm">체험을 진행하고 본인의 SNS에 솔직한 리뷰를 작성해주세요.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">4. 포인트 획득</h3>
              <p className="text-neutral-600 text-sm">리뷰 확인 후 포인트가 지급되며 현금으로 환전도 가능합니다.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* 인플루언서 CTA */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">인플루언서 회원이 되어보세요</h2>
              <p className="mb-6 md:pr-8">팔로워 500명 이상이면 누구나 인플루언서 회원이 될 수 있습니다. 여러분의 소중한 경험을 공유하고 다양한 혜택을 받아보세요.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-white text-primary hover:bg-neutral-100 rounded-full">
                    인플루언서 신청하기
                  </Button>
                </Link>
                <Link href="/influencer-guide">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 rounded-full">
                    더 알아보기
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                  <div className="text-3xl font-bold mb-2">2만+</div>
                  <p className="text-white/80">활동 중인 인플루언서</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                  <div className="text-3xl font-bold mb-2">5천+</div>
                  <p className="text-white/80">월 평균 체험 건수</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                  <div className="text-3xl font-bold mb-2">15만+</div>
                  <p className="text-white/80">월 평균 리뷰 수</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                  <div className="text-3xl font-bold mb-2">1억+</div>
                  <p className="text-white/80">월 평균 지급 포인트</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

// User 컴포넌트 정의
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}
