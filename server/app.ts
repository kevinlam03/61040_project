import PostConcept from "./concepts/post";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";
import NotificationConcept from "./concepts/notification";
import MonitorConcept from "./concepts/monitors";
import FollowConcept from "./concepts/follow";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Follow = new FollowConcept("followerRelations", "followRequests");
export const Monitor = new FollowConcept("monitorRelations", "monitorRequests");
export const Notification = new NotificationConcept();
