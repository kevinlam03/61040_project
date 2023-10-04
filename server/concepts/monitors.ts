import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface MonitorRelation extends BaseDoc {
  monitor: ObjectId;
  monitored: ObjectId;
}

export interface MonitorRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  status: "pending" | "rejected" | "accepted";
}

export default class MonitorConcept {
  public readonly monitors = new DocCollection<MonitorRelation>("monitors");
  public readonly requests = new DocCollection<MonitorRequestDoc>("monitorRequests");

  async getRequests(user: ObjectId) {
    return await this.requests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }

  async sendRequest(from: ObjectId, to: ObjectId) {
    await this.requests.createOne({ from, to, status: "pending" });
    return { msg: "Sent request!" };
  }

  async acceptRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    // Following two can be done in parallel, thus we use `void`
    void this.requests.createOne({ from, to, status: "accepted" });
    void this.addMonitor(to, from);
    return { msg: "Accepted request!" };
  }

  async rejectRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    await this.requests.createOne({ from, to, status: "rejected" });
    return { msg: "Rejected request!" };
  }

  async removeRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    return { msg: "Removed request!" };
  }

  async removeMonitor(monitor: ObjectId, monitored: ObjectId) {
    const monitorRelation = await this.monitors.popOne({monitor, monitored});

    return { msg: "Unmonitored!" };
  }

  async getMonitored(monitor: ObjectId) {
    const monitoredList = await this.monitors.readMany({ monitor });

    return monitoredList
  }

  private async addMonitor(monitor: ObjectId, monitored: ObjectId) {
    void this.monitors.createOne({ monitor, monitored });
  }

  private async removePendingRequest(from: ObjectId, to: ObjectId) {
    const request = await this.requests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new NotFoundError("Request not found");
    }
    return request;
  }


  
}

