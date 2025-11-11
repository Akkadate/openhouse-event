/*
 * =================================================================
 * Code.gs (v5_FINAL_DEBUG_FIXED)
 * =================================================================
 */


// ---------------------

// --- 1. CONFIGURATION ---
const VERSION = "v5_FINAL_DEBUG"; 
const SHEET_ID = "141IRFdcKU-0zEAqMiYKRx0u6tr8K-0au8JcgkCUEhGk"; // ⬅️ ❗️❗️ ใส่ ID ของ Sheet "อันที่ 4" (OpenHouse_FINAL) ที่นี่
const FOLDER_ID = "1Z2NywnOIiXNwejq03TeGi6rVrfFT6Bd5"; // ⬅️ ❗️❗️ ใส่ ID Folder ของคุณ
const SHEET_NAME = "Activities";
// ---

const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
const uploadFolder = DriveApp.getFolderById(FOLDER_ID);

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No POST data");
    }

    const data = JSON.parse(e.postData.contents);
    let imageUrl = "";

    // ถ้ามีไฟล์จาก admin.html
    if (data.fileData && data.fileName && data.fileType) {
  var base64 = data.fileData;
  var commaIndex = base64.indexOf(",");
  if (commaIndex !== -1) {
    base64 = base64.substring(commaIndex + 1);
  }

  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, data.fileType, data.fileName);
  const file = uploadFolder.createFile(blob);

  // ให้ทุกคนที่มีลิงก์ดูได้
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId = file.getId();

  // ✅ ใช้ direct image host ของ Google (หลบ ORB / 403)
  // พอเหมาะสำหรับฝังเป็นรูปในเว็บ
  const directImageUrl = "https://lh3.googleusercontent.com/d/" + fileId;

  imageUrl = directImageUrl;
}


    // เพิ่มแถวลงชีต (ต้องมี header ตรงนี้ในแถวแรก)
    // faculty_key | datetime | title | detail | location | map_link | image_url
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

function doGet(e) {
  try {
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return jsonResponse({
        status: "success",
        version: VERSION,
        data: []
      });
    }

    const headers = data.shift();
    const rows = data.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[String(h).trim()] = row[i];
      });
      return obj;
    });

    return jsonResponse({
      status: "success",
      version: VERSION,
      data: rows
    });

  } catch (err) {
    return jsonResponse({
      status: "error",
      version: VERSION,
      message: err.message
    });
  }
}

/**
 * OPTIONS:
 * Apps Script web app ปกติจะไม่ใช้ doOptions สำหรับ CORS แบบ custom ได้จริง
 * ฟังก์ชันนี้ใส่ไว้กัน frontend เรียกเฉย ๆ (จะรีเทิร์น JSON เปล่าๆ)
 */
function doOptions(e) {
  return jsonResponse({
    status: "ok",
    version: VERSION,
    message: "OPTIONS not fully supported for custom CORS in Apps Script"
  });
}
