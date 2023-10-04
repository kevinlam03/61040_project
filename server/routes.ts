import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Friend, Post, User, WebSession, Notification, Monitor } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

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

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // NOTIFICATIONS
  @Router.get("/users/:user/notifications/") 
  async getUserNotifications(session: WebSessionDoc) {
    const user = WebSession.getUser(session);

    return await Notification.getUserNotifications(user);
  }

  @Router.post("/users/:user/notifications")
  async addNotification(username: string, content: string) {
      const user = await User.getUserByUsername(username);
      return await Notification.addNotification(user._id, content);
  }

  @Router.delete("/users/:user/notifications")
  async removeNotification(notification: ObjectId) {
    return await Notification.removeNotification(notification)
  }

  @Router.put("/users/:user/notifications") 
  async readNotification(notification: ObjectId) {
    return await Notification.readNotification(notification)
  }


  // MONITOR
  @Router.get("/monitored/:user/")
  async getMonitored(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Monitor.getMonitored(user);
  }

  @Router.delete("/monitored/:target")
  async removeMonitor(session: WebSessionDoc, target: string) {
    const monitor = WebSession.getUser(session);
    const monitored = (await User.getUserByUsername(target))._id;
    return await Monitor.removeMonitor(monitor, monitored);
  }

  @Router.get("/monitor/requests")
  async getMonitorRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Monitor.getRequests(user);
  }

  @Router.post("/monitor/requests")
  async sendMonitorRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Monitor.sendRequest(user, toId);
  }

  @Router.delete("/monitor/requests")
  async removeMonitorRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Monitor.removeRequest(user, toId);
  }

  @Router.put("/monitor/requests")
  async acceptMonitorRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Monitor.acceptRequest(fromId, user);
  }

  @Router.put("/monitors/requests")
  async rejectMonitorRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Monitor.rejectRequest(fromId, user);
  }



  // FOLLOW
  // Note: very similar to pre-implemented Friend concept, just need to add a few routes to Friend 
  // once repurposed. 


  // SCREENTIME
  @Router.post("/users/:user/screentime/:url")
  async setTimedUsed(url: string, username: string) {
    // set timeUsed for user for specified url
  }

  @Router.get("/users/:user/screentime/:url")
  async getTimedUsed(url: string, username: string) {
    // get timeUsed for user for specified url
  }

  // TIMERESTRICTION
  @Router.post("/users/:user/restrictions")
  async addRestriction(url: string, username: string) {
    // add restriction for user for specified url
  }

  @Router.delete("/users/:user/restrictions")
  async removeRestriction(url: string, username: string) {
    // remove restriction for user for specified url
  }

  @Router.get("/users/:user/restrictions/:url")
  async isRestricted(url: string, username: string) {
    // check restriction for user for specified url
  }

  // SEARCH
  @Router.get("/search")
  async searchPosts(search: string) {
    // return all posts matching some keywords
  }
}

export default getExpressRouter(new Routes());
