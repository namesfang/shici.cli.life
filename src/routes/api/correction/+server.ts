import { client } from '$lib/prisma'
import { client as redisClient } from '$lib/redis'
import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  const { postId, type, captcha, content } = await request.json()

  if(!type || !content || !captcha) {
    return json({
      msg: '数据不完整',
      code: 1
    })
  }

  const redis = await redisClient()
  const text = await redis.get(`captcha:${locals.sessionid}`)

  if(!text) {
    return json({
      msg: '验证码异常',
      code: 1,
    })
  }
  
  if(text.toLowerCase() !== captcha.toLowerCase()) {
    return json({
      msg: '验证码不正确',
      code: 1,
    })
  }

  await redis.disconnect();

  try {
    await client.correction.create({
      data: {
        postId,
        userId: locals.user?.id,
        type,
        content,
      }
    })
  
    return json({
      msg: '提交成功',
      code: 0
    })
  } catch (error) {
    return json({
      msg: `提交失败`,
      code: 1
    })
  }
}