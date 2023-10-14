import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { 
  Follow, 
  Feed,
  Post, 
  User, 
  WebSession, 
  Notification, 
  Monitor, 
  ScreenTime,
  TimeRestriction,
} from "./app";

import { PostDoc, PostOptions } from "./concepts/post";

import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";
import { BadValuesError, NotAllowedError } from "./concepts/errors";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  /////////////////////
  // POSTS
  /////////////////////
  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options); 
    // get list of people following us
    const relations = await Follow.getRelations(user);
    
    // add post to feeds of people following this user
    if (created.post !== null) {
      for (const relation of relations) {
        if (relation.target.toString() === user.toString()) {
          void Feed.addToFeed(relation.viewer, created.post._id)
        }
      }
    }
    
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  /////////////////////
  // FEED
  /////////////////////
  @Router.get("/feed/starredFeed") 
  async getStarredFeed(session: WebSessionDoc) {
    const user_id = WebSession.getUser(session);
    const feedDocs = await Feed.getFeed(user_id);

    // now, read those posts from database
    const feed : Array<PostDoc> = [];
    for (const feedDoc of feedDocs) {
      const cur_post = await Post.getPost(feedDoc.post);
      if (cur_post !== null) 
        if (await Feed.starredStatus(user_id, cur_post.author))
          feed.push(cur_post);
    }

    return await Responses.posts(feed);
  }

  @Router.get("/feed/notStarredFeed") 
  async getNotStarredFeed(session: WebSessionDoc) {
    const user_id = WebSession.getUser(session);
    const feedDocs = await Feed.getFeed(user_id);

    // now, read those posts from database
    const feed : Array<PostDoc> = [];
    for (const feedDoc of feedDocs) {
      const cur_post = await Post.getPost(feedDoc.post);
      if (cur_post !== null) 
        if (!await Feed.starredStatus(user_id, cur_post.author))
          feed.push(cur_post);
    }

    return await Responses.posts(feed);
  }

  @Router.delete("/feed/posts/:postID")
  async removeFromFeed(username: string, postID: string) {
    const user_id = (await User.getUserByUsername(username))._id;
    return await Feed.removeFromFeed(user_id, new ObjectId(postID));
  }

  @Router.get("/feed/stars")
  async getStarred(session: WebSessionDoc) {
    const user_id = WebSession.getUser(session);
    return await Responses.starredUsers(await Feed.getStarred(user_id));
  }

  @Router.post("/feed/stars/:target")
  async addStar(session: WebSessionDoc, target: string) {
    console.log("addstar")
    const user_id = WebSession.getUser(session);
    const target_id = (await User.getUserByUsername(target))._id;
    // to add a star, you must be following them
    await Follow.isViewing(user_id, target_id);
    return await Feed.addStar(user_id, target_id);
  }

  // not sure why the handler isn't being called...
  @Router.delete("/feed/stars/:target")
  async removeStar(session: WebSessionDoc, target: string) {
    const user_id = WebSession.getUser(session);
    const target_id = (await User.getUserByUsername(target))._id;
    return await Feed.removeStar(user_id, target_id);
  }

  /////////////////////
  // FOLLOW
  /////////////////////
  @Router.get("/follow")
  async getFollowRelations(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    // do some Response converting here?
    return await Responses.relations(await Follow.getRelations(user));
  }

  @Router.delete("/follow/following/:target")
  async stopFollowing(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    return await Follow.removeRelation(user, targetId);
  }

  @Router.delete("/follow/followers/:target")
  async removeFollower(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    return await Follow.removeRelation(targetId, user);
  }

  // TODO: fix Responses
  @Router.get("/follow/requests")
  async getFollowRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.relationRequests(await Follow.getRequests(user));
  }

  @Router.post("/follow/requests/:to")
  async sendFollowRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Follow.sendRequest(user, toId);
  }

  @Router.delete("/follow/requests/:to")
  async removeFollowRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Follow.removeRequest(user, toId);
  }

  @Router.put("/follow/accept/:from")
  async acceptFollowRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Follow.acceptRequest(fromId, user);
  }

  @Router.put("/follow/reject/:from")
  async rejectFollowRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Follow.rejectRequest(fromId, user);
  }

  /////////////////////
  // NOTIFICATIONS
  /////////////////////
  @Router.get("/notifications") 
  async getUserNotifications(session: WebSessionDoc) {
    WebSession.isLoggedIn(session);
    const user = WebSession.getUser(session);
    return await Responses.notifications(await Notification.getUserNotifications(user));
  }

  @Router.post("/notifications/:username")
  // username is a url parameter, content is a body parameter
  async addNotification(username: string, content: string) {
      if (!username || !content) {
        throw new BadValuesError("Username and content must be non-empty!");
      }
      const user = await User.getUserByUsername(username);
      return await Notification.addNotification(user._id, content);
  }

  @Router.delete("/notifications/:notificationID")
  async removeNotification(session: WebSessionDoc, notificationID: string) {
    WebSession.isLoggedIn(session);
    if (!notificationID) {
      throw new BadValuesError("NotificationID must be non-empty!");
    }

    // check if user is allowed to remove notification
    const user_id = WebSession.getUser(session);
    Notification.canRemoveNotification(user_id, new ObjectId(notificationID));
    return await Notification.removeNotification(new ObjectId(notificationID))
  }

  @Router.patch("/notifications/:notificationID") 
  async readNotification(session: WebSessionDoc, notificationID: string) {
    WebSession.isLoggedIn(session);
    if (!notificationID) {
      throw new BadValuesError("NotificationID must be non-empty!");
    }

    // check if user is allowed to read notification, you can read it if you can remove it
    const user_id = WebSession.getUser(session);
    Notification.canRemoveNotification(user_id, new ObjectId(notificationID));

    return await Notification.readNotification(new ObjectId(notificationID));
  }


  /////////////////////
  // MONITOR
  /////////////////////
  @Router.get("/monitorRelations/requests")
  async getMonitorRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.relationRequests(await Monitor.getRequests(user));
  }

  @Router.post("/monitorRelations/requests/:to")
  async sendMonitorRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;

    if (user.toString() === toId.toString()) {
      throw new BadValuesError("You can't send a request to yourself!")
    }

    return await Monitor.sendRequest(user, toId);
  }

  @Router.delete("/monitorRelations/requests/:to")
  async removeMonitorRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;

    return await Monitor.removeRequest(user, toId);
  }

  @Router.put("/monitorRelations/requests/accept/:from")
  async acceptMonitorRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;

    return await Monitor.acceptShareRequest(fromId, user);
  }

  @Router.put("/monitorRelations/requests/reject/:from")
  async rejectMonitorRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;

    return await Monitor.rejectRequest(fromId, user);
  }


  @Router.get("/monitorRelations")
  async getMonitorRelations(session: WebSessionDoc) {
    const curr_user = WebSession.getUser(session);
    return await Responses.relations(await Monitor.getRelations(curr_user));
  }

  @Router.delete("/monitorRelations/monitoring/:target")
  async stopMonitoring(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    return await Monitor.removeRelation(user, targetId);
  }

  @Router.delete("/monitorRelations/monitors/:target")
  async removeMonitor(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    return await Monitor.removeRelation(targetId, user);
  }



  /////////////////////
  // SCREENTIME
  /////////////////////
  @Router.get("/screenTime/:username/:feature")
  async getTimedUsed(session: WebSessionDoc, username: string, feature: string, day: string, month: string, year: string) {
    // get timeUsed for user, make sure current session is a monitor or self
    const target_id = (await User.getUserByUsername(username))._id;
    const user = WebSession.getUser(session);

    await Monitor.isViewing(user, target_id);

    console.log(day, month, year)
    return await ScreenTime.getTimeUsed(
      target_id, 
      { name:feature }, 
      {
        day: parseInt(day), 
        month: parseInt(month), 
        year: parseInt(year)
      }
    );
  }

  @Router.post("/screenTime/:username/:feature")
  async setTimedUsed(username: string, feature: string, time: string, day: string, month: string, year: string) {
    // set timeUsed for user for specified feature
    console.log("Entered settime")
    const user_id = (await User.getUserByUsername(username))._id;
    return await ScreenTime.setTimeUsed(
      user_id, 
      { name: feature }, 
      {
        day: parseInt(day), 
        month: parseInt(month), 
        year: parseInt(year)
      },
      Number(time),
    );
  }


  /////////////////////
  // TIMERESTRICTION
  /////////////////////
  @Router.post("/restrictions/:feature")
  async addRestriction(session: WebSessionDoc, feature: string, limit: string) {
    // add restriction for user for specified url
    const user_id = WebSession.getUser(session);
    return await TimeRestriction.addRestriction(user_id, { name: feature }, Number(limit));
  }

  @Router.put("/restrictions/:feature")
  async updateRestriction(session: WebSessionDoc, feature: string, limit: string) {
    const user_id = WebSession.getUser(session);
    return await TimeRestriction.setRestriction(user_id, { name: feature }, Number(limit));
  }

  @Router.delete("/restrictions/:username/:feature")
  async removeRestriction(session: WebSessionDoc, feature: string) {
    // remove restriction for user for specified url
    const user_id = WebSession.getUser(session);
    return await TimeRestriction.removeRestriction(user_id, { name: feature });
  }

  @Router.get("/restrictions/:feature")
  async isRestricted(session: WebSessionDoc, feature: string) {
    // check restriction for user for specified url
    const user_id = WebSession.getUser(session);
    // check timeUsed for that restriction
    const date = new Date()
    const time = await ScreenTime.getTimeUsed(
      user_id,
      { name: feature }, 
      { 
        day: date.getDay(),
        month: date.getMonth(),
        year: date.getFullYear(),
      }
    );
    return await TimeRestriction.restrictionExceeded(user_id, { name: feature }, time);
  }


}

export default getExpressRouter(new Routes());
