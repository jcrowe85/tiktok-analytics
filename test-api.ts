import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;

async function testAPI() {
  console.log('Testing TikTok API endpoints...\n');

  // Test 1: User Info
  console.log('🧪 Test 1: GET /v2/user/info/');
  try {
    const userInfo = await axios.get(
      'https://open.tiktokapis.com/v2/user/info/',
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        params: {
          fields: 'open_id,union_id,avatar_url,display_name',
        },
      }
    );
    console.log('✅ User Info Success:',  JSON.stringify(userInfo.data, null, 2));
  } catch (error: any) {
    console.log('❌ User Info Failed:', error.response?.data || error.message);
  }

  // Test 2: Video List (current approach)
  console.log('\n🧪 Test 2: POST /v2/video/list/ (current approach)');
  try {
    const videoList = await axios.post(
      'https://open.tiktokapis.com/v2/video/list/',
      {
        fields: ['id'],
        max_count: 1,
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Video List Success:', JSON.stringify(videoList.data, null, 2));
  } catch (error: any) {
    console.log('❌ Video List Failed:', error.response?.data || error.message);
  }

  // Test 3: Video List with query params
  console.log('\n🧪 Test 3: POST /v2/video/list/ (with query params)');
  try {
    const videoList = await axios.post(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,create_time',
      {
        max_count: 1,
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Video List Success:', JSON.stringify(videoList.data, null, 2));
  } catch (error: any) {
    console.log('❌ Video List Failed:', error.response?.data || error.message);
  }
}

testAPI();

