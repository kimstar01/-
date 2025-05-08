import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCampaignSchema, 
  insertApplicationSchema, 
  insertNotificationSchema,
  insertLikeSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // 인증 관련 라우트 설정
  setupAuth(app);

  // 캠페인 관련 API
  app.get("/api/campaigns", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string || '전체';
      const campaigns = await storage.getCampaignsByCategory(category);
      
      // 각 캠페인의 신청 수 추가
      const campaignsWithApplicantCount = await Promise.all(
        campaigns.map(async (campaign) => {
          const applications = await storage.getApplications(campaign.id);
          return {
            ...campaign,
            applicantsCount: applications.length
          };
        })
      );
      
      res.json(campaignsWithApplicantCount);
    } catch (error) {
      console.error('캠페인 목록 조회 오류:', error);
      res.status(500).json({ message: "캠페인 목록을 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const campaignId = Number(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "캠페인을 찾을 수 없습니다." });
      }
      
      // 조회수 증가
      await storage.updateCampaignViews(campaignId);
      
      // 신청 수 추가
      const applications = await storage.getApplications(campaignId);
      
      // 사용자가 로그인한 경우 좋아요 여부 확인
      let isLiked = false;
      if (req.isAuthenticated()) {
        const like = await storage.getLike(req.user.id, campaignId);
        isLiked = !!like;
      }
      
      res.json({
        ...campaign,
        applicantsCount: applications.length,
        isLiked
      });
    } catch (error) {
      console.error('캠페인 상세 조회 오류:', error);
      res.status(500).json({ message: "캠페인 상세정보를 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/campaigns", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      if (req.user.role !== 'advertiser') {
        return res.status(403).json({ message: "광고주만 캠페인을 등록할 수 있습니다." });
      }
      
      const parsedData = insertCampaignSchema.parse({
        ...req.body,
        advertiserId: req.user.id
      });
      
      const campaign = await storage.createCampaign(parsedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 유효하지 않습니다.", errors: error.errors });
      }
      console.error('캠페인 등록 오류:', error);
      res.status(500).json({ message: "캠페인 등록 중 오류가 발생했습니다." });
    }
  });

  // 신청서 관련 API
  app.post("/api/applications", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      if (req.user.role !== 'influencer') {
        return res.status(403).json({ message: "인플루언서만 신청할 수 있습니다." });
      }
      
      const parsedData = insertApplicationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // 캠페인 존재 여부 확인
      const campaign = await storage.getCampaign(parsedData.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "캠페인을 찾을 수 없습니다." });
      }
      
      // 이미 신청했는지 확인
      const userApplications = await storage.getApplicationsByUser(req.user.id);
      const alreadyApplied = userApplications.some(app => app.campaignId === parsedData.campaignId);
      
      if (alreadyApplied) {
        return res.status(400).json({ message: "이미 신청한 캠페인입니다." });
      }
      
      // 모집 인원 초과 여부 확인
      const applications = await storage.getApplications(parsedData.campaignId);
      if (applications.length >= campaign.capacity) {
        return res.status(400).json({ message: "모집 인원이 초과되었습니다." });
      }
      
      // 신청서 저장
      const application = await storage.createApplication(parsedData);
      
      // 알림 생성
      await storage.createNotification({
        userId: campaign.advertiserId,
        type: '신청접수',
        message: `'${campaign.title}' 캠페인에 새로운 신청이 접수되었습니다.`,
        relatedId: application.id
      });
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 유효하지 않습니다.", errors: error.errors });
      }
      console.error('신청서 제출 오류:', error);
      res.status(500).json({ message: "신청서 제출 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/applications/user", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      const applications = await storage.getApplicationsByUser(req.user.id);
      
      // 캠페인 정보 추가
      const applicationsWithCampaign = await Promise.all(
        applications.map(async (application) => {
          const campaign = await storage.getCampaign(application.campaignId);
          return {
            ...application,
            campaign
          };
        })
      );
      
      res.json(applicationsWithCampaign);
    } catch (error) {
      console.error('신청 내역 조회 오류:', error);
      res.status(500).json({ message: "신청 내역을 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/applications/campaign/:campaignId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      const campaignId = Number(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "캠페인을 찾을 수 없습니다." });
      }
      
      // 광고주 본인의 캠페인인지 확인
      if (campaign.advertiserId !== req.user.id) {
        return res.status(403).json({ message: "해당 캠페인의 신청 내역을 볼 권한이 없습니다." });
      }
      
      const applications = await storage.getApplications(campaignId);
      
      // 신청자 정보 추가
      const applicationsWithUser = await Promise.all(
        applications.map(async (application) => {
          const user = await storage.getUser(application.userId);
          return {
            ...application,
            user: user ? {
              id: user.id,
              username: user.username,
              name: user.name,
              profileImage: user.profileImage,
              followers: user.followers,
              instagramId: user.instagramId,
              blogUrl: user.blogUrl,
              twitterId: user.twitterId
            } : null
          };
        })
      );
      
      res.json(applicationsWithUser);
    } catch (error) {
      console.error('캠페인 신청 내역 조회 오류:', error);
      res.status(500).json({ message: "캠페인 신청 내역을 가져오는 중 오류가 발생했습니다." });
    }
  });

  // 신청 상태 변경 API
  app.patch("/api/applications/:id/status", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      const applicationId = Number(req.params.id);
      const { status } = req.body;
      
      if (!['승인됨', '거절됨'].includes(status)) {
        return res.status(400).json({ message: "유효하지 않은 상태입니다." });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "신청서를 찾을 수 없습니다." });
      }
      
      const campaign = await storage.getCampaign(application.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "캠페인을 찾을 수 없습니다." });
      }
      
      // 광고주 본인의 캠페인인지 확인
      if (campaign.advertiserId !== req.user.id) {
        return res.status(403).json({ message: "해당 신청서의 상태를 변경할 권한이 없습니다." });
      }
      
      const updatedApplication = await storage.updateApplicationStatus(applicationId, status);
      
      // 알림 생성
      const notificationType = status === '승인됨' ? '승인알림' : '거절알림';
      const notificationMessage = status === '승인됨' 
        ? `'${campaign.title}' 캠페인 신청이 승인되었습니다.` 
        : `'${campaign.title}' 캠페인 신청이 거절되었습니다.`;
      
      await storage.createNotification({
        userId: application.userId,
        type: notificationType,
        message: notificationMessage,
        relatedId: application.campaignId
      });
      
      res.json(updatedApplication);
    } catch (error) {
      console.error('신청 상태 변경 오류:', error);
      res.status(500).json({ message: "신청 상태 변경 중 오류가 발생했습니다." });
    }
  });

  // 리뷰 제출 API
  app.patch("/api/applications/:id/review", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      const applicationId = Number(req.params.id);
      const { reviewUrl } = req.body;
      
      if (!reviewUrl) {
        return res.status(400).json({ message: "리뷰 URL이 필요합니다." });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "신청서를 찾을 수 없습니다." });
      }
      
      // 본인 신청서인지 확인
      if (application.userId !== req.user.id) {
        return res.status(403).json({ message: "해당 신청서에 리뷰를 제출할 권한이 없습니다." });
      }
      
      // 승인된 신청서만 리뷰 제출 가능
      if (application.status !== '승인됨') {
        return res.status(400).json({ message: "승인된 신청서만 리뷰를 제출할 수 있습니다." });
      }
      
      const updatedApplication = await storage.updateApplicationReview(applicationId, reviewUrl);
      
      // 캠페인 정보 가져오기
      const campaign = await storage.getCampaign(application.campaignId);
      
      // 알림 생성
      await storage.createNotification({
        userId: campaign.advertiserId,
        type: '리뷰승인',
        message: `'${campaign.title}' 캠페인에 리뷰가 제출되었습니다.`,
        relatedId: applicationId
      });
      
      res.json(updatedApplication);
    } catch (error) {
      console.error('리뷰 제출 오류:', error);
      res.status(500).json({ message: "리뷰 제출 중 오류가 발생했습니다." });
    }
  });

  // 포인트 지급 API
  app.post("/api/applications/:id/award-points", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      const applicationId = Number(req.params.id);
      const { points } = req.body;
      
      if (!points || points <= 0) {
        return res.status(400).json({ message: "유효한 포인트를 입력해주세요." });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "신청서를 찾을 수 없습니다." });
      }
      
      const campaign = await storage.getCampaign(application.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "캠페인을 찾을 수 없습니다." });
      }
      
      // 광고주 본인의 캠페인인지 확인
      if (campaign.advertiserId !== req.user.id) {
        return res.status(403).json({ message: "해당 신청서에 포인트를 지급할 권한이 없습니다." });
      }
      
      // 이미 포인트가 지급되었는지 확인
      if (application.pointsAwarded) {
        return res.status(400).json({ message: "이미 포인트가 지급되었습니다." });
      }
      
      // 리뷰가 제출된 상태인지 확인
      if (!application.reviewUrl) {
        return res.status(400).json({ message: "리뷰가 제출되지 않은 신청서에는 포인트를 지급할 수 없습니다." });
      }
      
      // 신청서 업데이트
      const updatedApplication = await storage.getApplication(applicationId);
      updatedApplication.pointsAwarded = points;
      await storage.updateApplicationStatus(applicationId, '완료됨');
      
      // 사용자 포인트 업데이트
      await storage.updateUserPoints(application.userId, points);
      
      // 알림 생성
      await storage.createNotification({
        userId: application.userId,
        type: '포인트적립',
        message: `'${campaign.title}' 캠페인 리뷰에 대한 ${points} 포인트가 지급되었습니다.`,
        relatedId: applicationId
      });
      
      res.json({ ...updatedApplication, pointsAwarded: points });
    } catch (error) {
      console.error('포인트 지급 오류:', error);
      res.status(500).json({ message: "포인트 지급 중 오류가 발생했습니다." });
    }
  });

  // 알림 관련 API
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error('알림 조회 오류:', error);
      res.status(500).json({ message: "알림을 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      const notificationId = Number(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "알림을 찾을 수 없습니다." });
      }
      
      res.json(notification);
    } catch (error) {
      console.error('알림 읽음 표시 오류:', error);
      res.status(500).json({ message: "알림 읽음 표시 중 오류가 발생했습니다." });
    }
  });

  // 좋아요 관련 API
  app.post("/api/campaigns/:id/like", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      const campaignId = Number(req.params.id);
      const userId = req.user.id;
      
      // 캠페인 존재 여부 확인
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "캠페인을 찾을 수 없습니다." });
      }
      
      // 이미 좋아요 했는지 확인
      const existingLike = await storage.getLike(userId, campaignId);
      
      if (existingLike) {
        // 좋아요 취소
        await storage.removeLike(userId, campaignId);
        await storage.updateCampaignLikes(campaignId, false);
        return res.json({ liked: false });
      } else {
        // 좋아요 추가
        const likeData = insertLikeSchema.parse({ userId, campaignId });
        await storage.createLike(likeData);
        await storage.updateCampaignLikes(campaignId, true);
        return res.json({ liked: true });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 유효하지 않습니다.", errors: error.errors });
      }
      console.error('좋아요 오류:', error);
      res.status(500).json({ message: "좋아요 처리 중 오류가 발생했습니다." });
    }
  });

  // 광고주 대시보드 API
  app.get("/api/advertiser/campaigns", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      if (req.user.role !== 'advertiser') {
        return res.status(403).json({ message: "광고주만 접근할 수 있습니다." });
      }
      
      const campaigns = await storage.getCampaignsByAdvertiserId(req.user.id);
      
      // 각 캠페인의 신청 수 추가
      const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const applications = await storage.getApplications(campaign.id);
          return {
            ...campaign,
            applicantsCount: applications.length,
            approvedCount: applications.filter(app => app.status === '승인됨' || app.status === '완료됨').length,
            completedCount: applications.filter(app => app.status === '완료됨').length
          };
        })
      );
      
      res.json(campaignsWithStats);
    } catch (error) {
      console.error('광고주 캠페인 조회 오류:', error);
      res.status(500).json({ message: "광고주 캠페인 정보를 가져오는 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
