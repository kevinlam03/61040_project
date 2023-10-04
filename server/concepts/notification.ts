import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";


export interface NotificationDoc extends BaseDoc {
    time: string;
    message: string;
    user: ObjectId;
    status: "read" | "unread";
    // notification could also have a link?
}

export default class NotificationConcept {
    public readonly notifications = new DocCollection<NotificationDoc>("notifications");

    async addNotification(user: ObjectId, message: string) {
        // create new notification for this user, should be unread 
        await this.notifications.createOne({time: Date(), message, user, status:"unread"})

        return { msg: "Added notification!" }
    }

    async removeNotification(notification: ObjectId) {
        // delete notification
        const result = await this.notifications.deleteOne({_id: notification})
        
        return { msg: "Deleted notification!" }
    }

    async readNotification(notification: ObjectId) {
        // remove unread notification, insert read notification
        const updated = await this.notifications.readOne({_id:notification})
        
        await this.notifications.updateOne({_id:notification}, {status:"read"})

        return { msg: "Updated notification status!"}
    }

    async getUserNotifications(user: ObjectId) {
        // get all notifications associated with a user
        return await this.notifications.readMany({user:user})
    }
}