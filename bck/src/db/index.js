import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connecteDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`)
    
    console.log(
      `✅ 😊✔️ mongoDB connected! Db host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("❌ mongo db connected error", error);
    process.exit(1);
  }
};

export default connecteDB;
// edite
