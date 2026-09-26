const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(cors());

// ตั้งค่าให้ multer เก็บไฟล์ชั่วคราวในหน่วยความจำ (Memory)
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint ที่สอดคล้องกับหน้าเว็บของคุณที่เรียกไปที่ /api/verify-slip
app.post('/api/verify-slip', upload.single('slip'), async (req, res) => {
  try {
    const slipFile = req.file;
    const amount = req.body.amount;

    if (!slipFile) {
      return res.status(400).json({ success: false, message: 'ไม่พบไฟล์สลิป' });
    }

    // ข้อมูลจาก SlipOK ที่คุณต้องนำมาใส่
    const branchId = '76480';
    const apiKey = 'SLIPOKJG6PSK5';   

    // สร้าง FormData สำหรับส่งต่อไปยัง SlipOK API
    const formData = new FormData();
    formData.append('files', slipFile.buffer, {
      filename: slipFile.originalname,
      contentType: slipFile.mimetype,
    });
    formData.append('amount', amount);
    formData.append('log', 'true'); // เปิด log เพื่อตรวจสอบสลิปซ้ำ

    // ยิง Request ไปยัง SlipOK API
    const slipOkResponse = await axios.post(
      `https://api.slipok.com/api/line/apikey/${branchId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'x-authorization': apiKey,
        },
      }
    );

    // ส่งผลลัพธ์กลับไปหาหน้าเว็บของคุณ
    return res.json(slipOkResponse.data);

  } catch (error) {
    console.error('Error verifying slip:', error.response?.data || error.message);
    
    // ส่ง Error ที่ได้รับจาก SlipOK กลับไปแสดงผล
    if (error.response && error.response.data) {
      return res.status(400).json(error.response.data);
    }
    
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ SlipOK API' });
  }
});

// เริ่มรันเซิร์ฟเวอร์ที่พอร์ต 3000
app.listen(3000, () => {
  console.log('Backend server is running on http://localhost:3000');
});