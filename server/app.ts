import PostConcept from "./concepts/post";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";
import NotificationConcept from "./concepts/notification";
import FollowConcept from "./concepts/follow";
import ScreenTimeConcept from "./concepts/screenTime";
import TimeRestrictionConcept from "./concepts/timeRestrictions";
import FeedConcept from "./concepts/feed"

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Follow = new FollowConcept("followerRelations", "followRequests");
export const Monitor = new FollowConcept("monitorRelations", "monitorRequests");
export const Notification = new NotificationConcept();
export const ScreenTime = new ScreenTimeConcept();
export const TimeRestriction = new TimeRestrictionConcept();
export const Feed = new FeedConcept();
