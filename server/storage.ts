import { users, campaigns, applications, notifications, likes, type User, type Campaign, type Application, type Notification, type Like, type InsertUser, type InsertCampaign, type InsertApplication, type InsertNotification, type InsertLike } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// 세션 스토어 생성
const MemoryStore = createMemoryStore(session);

// 인터페이스 정의
export interface IStorage {
  // 세션 스토어
  sessionStore: session.SessionStore;

  // 사용자 관련
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User | undefined>;

  // 캠페인 관련
  getCampaigns(): Promise<Campaign[]>;
  getCampaignsByCategory(category: string): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignsByAdvertiserId(advertiserId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignLikes(campaignId: number, increment: boolean): Promise<Campaign | undefined>;
  updateCampaignViews(campaignId: number): Promise<Campaign | undefined>;

  // 신청서 관련
  getApplications(campaignId: number): Promise<Application[]>;
  getApplicationsByUser(userId: number): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application | undefined>;
  updateApplicationReview(id: number, reviewUrl: string): Promise<Application | undefined>;

  // 알림 관련
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // 좋아요 관련
  getLike(userId: number, campaignId: number): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  removeLike(userId: number, campaignId: number): Promise<void>;
}

// 인메모리 스토리지 구현
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private campaigns: Map<number, Campaign>;
  private applications: Map<number, Application>;
  private notifications: Map<number, Notification>;
  private likes: Map<number, Like>;
  sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentCampaignId: number;
  private currentApplicationId: number;
  private currentNotificationId: number;
  private currentLikeId: number;

  constructor() {
    this.users = new Map();
    this.campaigns = new Map();
    this.applications = new Map();
    this.notifications = new Map();
    this.likes = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24시간마다 만료된 세션 정리
    });
    this.currentUserId = 1;
    this.currentCampaignId = 1;
    this.currentApplicationId = 1;
    this.currentNotificationId = 1;
    this.currentLikeId = 1;
    
    // 초기 샘플 데이터 추가
    this.initializeData();
  }
  
  // 샘플 데이터 초기화
  private initializeData() {
    // 기본 광고주 계정 생성
    const advertiser = {
      id: this.currentUserId++,
      username: "samsung_ad",
      password: "$2b$10$XpC5nwC.QYwGkVYAfX8FY.OhYxnPOr1yW26uCX3oaLu7SWipbSaHS", // "password123"
      email: "marketing@samsung.com",
      name: "삼성전자",
      role: "advertiser" as const,
      profileImage: "https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
      points: 0,
      followers: 0,
      instagramId: null,
      blogUrl: null,
      twitterId: null,
      createdAt: new Date()
    };
    this.users.set(advertiser.id, advertiser);
    
    // 초기 캠페인 데이터 생성
    const sampleCampaigns = [
      {
        id: this.currentCampaignId++,
        title: "삼성 갤럭시 S25 얼리 체험단 모집",
        description: "공식 출시 전, 갤럭시 S25를 먼저 경험해보세요. 최신 카메라 기능과 AI 기능을 체험하고 솔직한 리뷰를 작성해주세요.",
        category: "전자제품",
        location: "서울 강남구",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-30"),
        capacity: 20,
        thumbnail: "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        images: [
          "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        requirements: "인스타그램 팔로워 5,000명 이상, 전자제품 리뷰 경험자 우대",
        compensation: "갤럭시 S25 1개월 무료 대여, 우수 리뷰어 선정 시 제품 증정",
        advertiserId: advertiser.id,
        viewCount: 243,
        likeCount: 56,
        createdAt: new Date("2024-05-01")
      },
      {
        id: this.currentCampaignId++,
        title: "강남 신규 브런치 카페 체험단",
        description: "강남역 인근에 오픈한 프리미엄 브런치 카페에서 신메뉴를 무료로 체험해보세요. 분위기 있는 인테리어와 함께 맛있는 식사를 즐기고 SNS에 리뷰를 남겨주세요.",
        category: "식당/카페",
        location: "서울 강남구",
        startDate: new Date("2024-05-15"),
        endDate: new Date("2024-06-15"),
        capacity: 30,
        thumbnail: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        images: [
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1513442542250-854d436a73f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        requirements: "인스타그램 활발히 활동 중인 분, 음식 사진 촬영 가능하신 분",
        compensation: "2인 브런치 세트 무료 제공 (음료 포함), 추가 쿠폰 증정",
        advertiserId: advertiser.id,
        viewCount: 189,
        likeCount: 42,
        createdAt: new Date("2024-04-28")
      },
      {
        id: this.currentCampaignId++,
        title: "프리미엄 스킨케어 제품 체험단",
        description: "프랑스 직수입 유기농 화장품 브랜드의 신제품 라인을 체험해보세요. 2주간 사용 후 피부 변화와 함께 솔직한 사용 리뷰를 남겨주시면 됩니다.",
        category: "뷰티",
        location: "온라인",
        startDate: new Date("2024-05-10"),
        endDate: new Date("2024-06-10"),
        capacity: 50,
        thumbnail: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        images: [
          "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        requirements: "30-40대 여성, 민감성/건성 피부 소유자 우대",
        compensation: "5종 스킨케어 풀세트 제공 (10만원 상당)",
        advertiserId: advertiser.id,
        viewCount: 328,
        likeCount: 78,
        createdAt: new Date("2024-04-25")
      },
      {
        id: this.currentCampaignId++,
        title: "최신 스마트홈 기기 체험단",
        description: "AI 기반 스마트홈 시스템을 무료로 설치해드리고 한 달간 사용해보세요. 일상생활에서 달라진 점과 편리함을 블로그에 리뷰해주시면 됩니다.",
        category: "전자제품",
        location: "수도권",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-07-15"),
        capacity: 15,
        thumbnail: "https://images.unsplash.com/photo-1558002038-bb0237f4baab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        images: [
          "https://images.unsplash.com/photo-1558002038-bb0237f4baab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1610164042354-8049d1a8a0d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1529236183275-4fdcf2bc987e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        requirements: "자가 주택 거주자, 블로그 운영 6개월 이상",
        compensation: "스마트홈 기기 3종 무상 설치 및 증정 (25만원 상당)",
        advertiserId: advertiser.id,
        viewCount: 156,
        likeCount: 34,
        createdAt: new Date("2024-05-02")
      },
      {
        id: this.currentCampaignId++,
        title: "제주도 프리미엄 리조트 체험단",
        description: "제주 서귀포에 위치한 5성급 리조트에서 2박 3일간 휴식을 취하며 시설과 서비스를 경험해보세요. 객실, 수영장, 레스토랑 등 다양한 시설 이용 후 리뷰를 작성해주시면 됩니다.",
        category: "숙박",
        location: "제주도",
        startDate: new Date("2024-06-15"),
        endDate: new Date("2024-08-31"),
        capacity: 10,
        thumbnail: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        images: [
          "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        requirements: "여행/라이프스타일 컨텐츠 제작 경험자, 인스타그램 10,000 팔로워 이상",
        compensation: "디럭스 오션뷰 2박 무료 제공 (2인 기준, 조식 포함)",
        advertiserId: advertiser.id,
        viewCount: 412,
        likeCount: 98,
        createdAt: new Date("2024-04-20")
      },
      {
        id: this.currentCampaignId++,
        title: "강남역 헬스장 체험단 모집",
        description: "강남역 1번 출구 도보 3분 거리에 위치한 프리미엄 피트니스센터에서 1개월 무료 이용권을 드립니다. 시설, 트레이너, 프로그램 등에 대한 후기를 SNS에 남겨주세요.",
        category: "스포츠/건강",
        location: "서울 강남구",
        startDate: new Date("2024-05-20"),
        endDate: new Date("2024-06-20"),
        capacity: 25,
        thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
        images: [
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1548690312-e3b507d8c110?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
          "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
        ],
        requirements: "20-40대, 운동 관련 SNS 활동 경험자",
        compensation: "1개월 무제한 이용권 및 PT 2회 무료 제공",
        advertiserId: advertiser.id,
        viewCount: 203,
        likeCount: 47,
        createdAt: new Date("2024-05-05")
      }
    ];
    
    // 캠페인 데이터 맵에 추가
    for (const campaign of sampleCampaigns) {
      this.campaigns.set(campaign.id, campaign);
    }
  }

  // 사용자 관련 메서드
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt, points: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, points: user.points + points };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // 캠페인 관련 메서드
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaignsByCategory(category: string): Promise<Campaign[]> {
    if (category === '전체') {
      return this.getCampaigns();
    }
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.category === category
    );
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByAdvertiserId(advertiserId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.advertiserId === advertiserId
    );
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentCampaignId++;
    const createdAt = new Date();
    const campaign: Campaign = { 
      ...insertCampaign, 
      id, 
      createdAt, 
      viewCount: 0, 
      likeCount: 0 
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaignLikes(campaignId: number, increment: boolean): Promise<Campaign | undefined> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return undefined;
    
    const updatedLikeCount = increment 
      ? campaign.likeCount + 1 
      : Math.max(0, campaign.likeCount - 1);
    
    const updatedCampaign = { ...campaign, likeCount: updatedLikeCount };
    this.campaigns.set(campaignId, updatedCampaign);
    return updatedCampaign;
  }

  async updateCampaignViews(campaignId: number): Promise<Campaign | undefined> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, viewCount: campaign.viewCount + 1 };
    this.campaigns.set(campaignId, updatedCampaign);
    return updatedCampaign;
  }

  // 신청서 관련 메서드
  async getApplications(campaignId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.campaignId === campaignId
    );
  }

  async getApplicationsByUser(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.userId === userId
    );
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const appliedAt = new Date();
    const application: Application = { 
      ...insertApplication, 
      id, 
      appliedAt, 
      status: '대기중',
      reviewUrl: null,
      reviewSubmittedAt: null,
      pointsAwarded: null
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async updateApplicationReview(id: number, reviewUrl: string): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const reviewSubmittedAt = new Date();
    const updatedApplication = { ...application, reviewUrl, reviewSubmittedAt, status: '완료됨' };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // 알림 관련 메서드
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const createdAt = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt, 
      isRead: false 
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // 좋아요 관련 메서드
  async getLike(userId: number, campaignId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      (like) => like.userId === userId && like.campaignId === campaignId
    );
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.currentLikeId++;
    const createdAt = new Date();
    const like: Like = { ...insertLike, id, createdAt };
    this.likes.set(id, like);
    return like;
  }

  async removeLike(userId: number, campaignId: number): Promise<void> {
    const like = await this.getLike(userId, campaignId);
    if (like) {
      this.likes.delete(like.id);
    }
  }
}

export const storage = new MemStorage();
