/**
 * NBU Open House API (Production)
 * - doPost: รับข้อมูลจาก admin.html ผ่าน PHP proxy แล้วบันทึกลงชีต + อัปโหลดรูป
 * - doGet: ส่งข้อมูลทั้งหมดให้ timeline.html ผ่าน PHP proxy
 */

const VERSION    = "v5_PROD";
const SHEET_ID   = "1JqbbL8x26v-m3wU8WwPcR6uX7T9rsDubQCVuTdRFVFA"; // Spreadsheet ID
const FOLDER_ID  = "16fBEuGfa_xT7XkIlO5pB9UadB80d1_c9";             // Folder สำหรับเก็บรูป
const SHEET_NAME = "Activities";

const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
const uploadFolder = DriveApp.getFolderById(FOLDER_ID);

/**
 * Helper: ส่ง JSON response
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST /exec
 * Expect JSON:
 * {
 *   faculty_key, datetime, title, detail, location, map_link,
 *   fileData (base64), fileName, fileType
 * }
 */
function doPost(e) {
  try {
    if (!sheet) {
      throw new Error("Sheet '" + SHEET_NAME + "' not found");
    }
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No POST data");
    }

    const data = JSON.parse(e.postData.contents);
    let imageUrl = "";

    // ถ้ามีไฟล์แนบ
    if (data.fileData && data.fileName && data.fileType) {
      let base64 = String(data.fileData);

      // กันกรณีเป็น dataURL
      const commaIndex = base64.indexOf(",");
      if (commaIndex !== -1) {
        base64 = base64.substring(commaIndex + 1);
      }

      const bytes = Utilities.base64Decode(base64);
      const blob = Utilities.newBlob(bytes, data.fileType, data.fileName);
      const file = uploadFolder.createFile(blob);

      // ให้ดูได้ทุกคนที่มีลิงก์
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const fileId = file.getId();

      // ใช้ direct image endpoint (แก้ปัญหา ORB/403)
      imageUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    }

    // append ตาม header: faculty_key | datetime | title | detail | location | map_link | image_url
    sheet.appendRow([
      data.faculty_key || "",
      data.datetime    || "",
      data.title       || "",
      data.detail      || "",
      data.location    || "",
      data.map_link    || "",
      imageUrl
    ]);

    return jsonResponse({
      status: "success",
      version: VERSION,
      message: "Event added successfully!",
      image_url: imageUrl
    });

  } catch (err) {
    return jsonResponse({
      status: "error",
      version: VERSION,
      message: err.message,
      stack: err.stack
    });
  }
}

/**
 * GET /exec
 * ส่งทุกกิจกรรมออกไปเป็น JSON
 */
function doGet(e) {
  try {
    if (!sheet) {
      throw new Error("Sheet '" + SHEET_NAME + "' not found");
    }

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return jsonResponse({
        status: "success",
        version: VERSION,
        data: []
      });
    }

    const headers = values.shift().map(h => String(h).trim());
    const data = values.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });

    return jsonResponse({
      status: "success",
      version: VERSION,
      data: data
    });

  } catch (err) {
    return jsonResponse({
      status: "error",
      version: VERSION,
      message: err.message,
      stack: err.stack
    });
  }
}
