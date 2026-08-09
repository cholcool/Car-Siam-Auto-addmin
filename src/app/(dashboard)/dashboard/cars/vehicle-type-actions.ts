'use server'

import prisma from '@/lib/prisma'
import { getSessionAndRoles } from '@/lib/auth-server'

interface CreateVehicleTypeInput {
  name: string
  description: string | null
  remark: string | null
}

export async function createVehicleType(input: CreateVehicleTypeInput) {
  try {
    const normalizedName = input.name.trim()
    const existing = await prisma.vehicleType.findFirst({
      where: {
        name: normalizedName,
        isDeleted: false,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'ประเภทรถนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น',
      }
    }

    const userRoles = await getSessionAndRoles()
    const userId = userRoles.session?.user?.id

    if (!userId) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบใหม่ก่อนสร้างข้อมูลประเภทรถ',
      }
    }

    const vehicleType = await prisma.vehicleType.create({
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
      data: vehicleType,
    }
  } catch (error) {
    console.error('[createVehicleType] Error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการสร้างประเภทรถ',
    }
  }
}
