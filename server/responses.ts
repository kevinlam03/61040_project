import { User } from "./app";

import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { Router } from "./framework/router";
import { 
  FollowRelationDoc, 
  FollowRequestAlreadyExistsError, 
  FollowRequestDoc, 
  FollowRequestNotFoundError, 
  RelationAlreadyExistsError, 
  RelationNotFoundError 
} from "./concepts/follow";

import {
  StarredDoc,
  StarredUserNotFoundError,
  AlreadyStarredUserError,
  PostInFeedAlreadyExistsError,
  PostNotFoundInFeedError
} from "./concepts/feed";

import {
  ScreenTimeDataNotFoundError 
} from "./concepts/screenTime";

import {
  TimeRestrictionNotFoundError,
  TimeRestrictionAlreadyExistsError 
} from "./concepts/timeRestrictions";

import { 
  NotificationDoc 
} from "./concepts/notification";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert FollowRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async relationRequests(requests: FollowRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }


  static async relations(relations: FollowRelationDoc[]) {
    const target = relations.map((relation) => relation.target);
    const viewer = relations.map((relation) => relation.viewer);
    const usernames = await User.idsToUsernames(target.concat(viewer));
    // convert each doc to have usernames instead of ids
    return relations.map((relation, i) => ({...relation, target: usernames[i], viewer: usernames[i + relations.length] }));
  }


  // FEED RESPONSES
  static async starredUsers(relations: StarredDoc[]) {
    const user = relations.map((relation) => relation.user);
    const target = relations.map((relation) => relation.target);
    const usernames = await User.idsToUsernames(user.concat(target));
    // convert each doc to have usernames instead of ids
    return relations.map((relation, i) => ({...relation, user: usernames[i], target: usernames[i + relations.length] }));
  }


  // NOTIFICATION RESPONSES
  static async notifications(notifications: NotificationDoc[]) {
    const user = notifications.map((noti) => noti.user);
    const usernames = await User.idsToUsernames(user);
    // convert each doc to have usernames instead of ids
    return notifications.map((noti, i) => ({...noti, user: usernames[i] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await User.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

// FOLLOW
Router.registerError(FollowRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FollowRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(RelationNotFoundError, async (e) => {
  const [viewer, target] = await Promise.all([User.getUserById(e.viewer), User.getUserById(e.target)]);
  return e.formatWith(viewer.username, target.username);
});

Router.registerError(RelationAlreadyExistsError, async (e) => {
  const [viewer, target] = await Promise.all([User.getUserById(e.viewer), User.getUserById(e.target)]);
  return e.formatWith(viewer.username, target.username);
});

// FEED
Router.registerError(StarredUserNotFoundError, async (e) => {
  const [user, target] = await Promise.all([User.getUserById(e.user), User.getUserById(e.target)]);
  return e.formatWith(user.username, target.username);
});

Router.registerError(AlreadyStarredUserError, async (e) => {
  const [user, target] = await Promise.all([User.getUserById(e.user), User.getUserById(e.target)]);
  return e.formatWith(user.username, target.username);
});

Router.registerError(PostInFeedAlreadyExistsError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.username, e.post);
});

Router.registerError(PostNotFoundInFeedError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.username, e.post);
});

// SCREENTIME

Router.registerError(ScreenTimeDataNotFoundError, async (e) => {
  const user = await User.getUserById(e.user);
  const dateString = e.date.month.toString() + "/" + e.date.day.toString() + "/" + e.date.year.toString()
  return e.formatWith(user.username, dateString);
});

// TIMERESTRICTION
Router.registerError(TimeRestrictionNotFoundError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.username, e.feature.name);
});

Router.registerError(TimeRestrictionAlreadyExistsError, async (e) => {
  const user = await User.getUserById(e.user);
  return e.formatWith(user.username, e.feature.name);
});








