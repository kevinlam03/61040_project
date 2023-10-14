import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";


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
        // create new unread notification for this user
        const doc_id = await this.notifications.createOne({
            time: Date(), 
            message, 
            user, 
            status:"unread"
        });
        
        return { msg: "Added notification!" };
    }

    async removeNotification(notification: ObjectId) {
        // delete notification
        await this.isNotification(notification);
        const result = await this.notifications.deleteOne({_id: notification})
        
        return { msg: "Deleted notification!" }
    }

    async readNotification(notificationID: ObjectId) {
        // throw NotFoundError if not a real notification
        this.isNotification(notificationID);
        
        await this.notifications.updateOne(
            {_id:notificationID}, 
            { 
                status:"read"
            }
        );

        return { msg: "Updated notification status!"}
    }

    async getUserNotifications(user: ObjectId) {
        // get all notifications associated with a user
        if (user === null) {
            throw new NotFoundError("User not found!")
        }

        return await this.notifications.readMany({user})
    }

    async isNotification(notificationID: ObjectId) {
        const notification = await this.notifications.readOne({_id:notificationID})
        if (notification === null) {
            throw new NotFoundError("Notification not found!")
        }
    }

    async canRemoveNotification(user: ObjectId, notificationID: ObjectId) {
        // notification must exist, and user must be user of that notification
        await this.isNotification(notificationID);

        const notif = await this.notifications.readOne({_id: notificationID, user: user});
        if (notif === null) {
            throw new NotAllowedError("This user doesn't have this notification!")
        }
    }
}