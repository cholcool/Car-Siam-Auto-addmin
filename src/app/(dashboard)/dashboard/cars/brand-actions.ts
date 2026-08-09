'use server'

import prisma from '@/lib/prisma'
import { getSessionAndRoles } from '@/lib/auth-server'

interface CreateBrandInput {
  name: string
  description: string | null
  remark: string | null
}

export async function createBrand(input: CreateBrandInput) {
  try {
    const normalizedName = input.name.trim()
    const existing = await prisma.brand.findFirst({
      where: {
        name: normalizedName,
        isDeleted: false,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'แบรนด์รถนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น',
      }
    }

    const userRoles = await getSessionAndRoles()
    const userId = userRoles.session?.user?.id

    if (!userId) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบใหม่ก่อนสร้างข้อมูลแบรนด์รถ',
      }
    }

    const brand = await prisma.brand.create({
      data: {
        name: normalizedName,
        description: input.description,
        remark: input.remark,
        isDeleted: false,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    })

    return {
      success: true,
      data: brand,
    }
  } catch (error) {
    console.error('[createBrand] Error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการสร้างแบรนด์รถ',
    }
  }
}
