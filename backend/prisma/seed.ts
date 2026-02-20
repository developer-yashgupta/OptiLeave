import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create teams
  const engineeringTeam = await prisma.team.create({
    data: {
      name: 'Engineering',
      managerId: 'temp-manager-id', // Will be updated after creating manager
    },
  })

  const productTeam = await prisma.team.create({
    data: {
      name: 'Product',
      managerId: 'temp-manager-id',
    },
  })

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      teamId: engineeringTeam.id,
    },
  })

  // Create manager for engineering team
  const engineeringManager = await prisma.user.create({
    data: {
      email: 'manager.eng@example.com',
      password: hashedPassword,
      name: 'Engineering Manager',
      role: 'MANAGER',
      teamId: engineeringTeam.id,
    },
  })

  // Update engineering team with manager
  await prisma.team.update({
    where: { id: engineeringTeam.id },
    data: { managerId: engineeringManager.id },
  })

  // Create manager for product team
  const productManager = await prisma.user.create({
    data: {
      email: 'manager.product@example.com',
      password: hashedPassword,
      name: 'Product Manager',
      role: 'MANAGER',
      teamId: productTeam.id,
    },
  })

  // Update product team with manager
  await prisma.team.update({
    where: { id: productTeam.id },
    data: { managerId: productManager.id },
  })

  // Create employees
  const employee1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'EMPLOYEE',
      teamId: engineeringTeam.id,
    },
  })

  const employee2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      role: 'EMPLOYEE',
      teamId: engineeringTeam.id,
    },
  })

  const employee3 = await prisma.user.create({
    data: {
      email: 'bob.johnson@example.com',
      password: hashedPassword,
      name: 'Bob Johnson',
      role: 'EMPLOYEE',
      teamId: productTeam.id,
    },
  })

  // Create leave balances for all users
  const users = [admin, engineeringManager, productManager, employee1, employee2, employee3]
  for (const user of users) {
    await prisma.leaveBalance.create({
      data: {
        userId: user.id,
        annual: 20,
        sick: 10,
        maternity: 90,
        paternity: 10,
        bereavement: 5,
      },
    })
  }

  // Create public holidays for 2024
  const holidays = [
    { name: "New Year's Day", date: new Date('2024-01-01') },
    { name: 'Independence Day', date: new Date('2024-07-04') },
    { name: 'Thanksgiving', date: new Date('2024-11-28') },
    { name: 'Christmas Day', date: new Date('2024-12-25') },
  ]

  for (const holiday of holidays) {
    await prisma.holiday.create({ data: holiday })
  }

  // Create default rules
  await prisma.rule.create({
    data: {
      name: 'Insufficient Balance',
      priority: 1,
      condition: {
        type: 'BALANCE',
        operator: 'LT',
        value: 0,
      },
      action: 'REJECT',
      enabled: true,
    },
  })

  await prisma.rule.create({
    data: {
      name: 'Deadline Conflict',
      priority: 2,
      condition: {
        type: 'DEADLINE',
        operator: 'LTE',
        value: 7,
      },
      action: 'ESCALATE',
      enabled: true,
    },
  })

  await prisma.rule.create({
    data: {
      name: 'Low Team Availability',
      priority: 3,
      condition: {
        type: 'AVAILABILITY',
        operator: 'LT',
        value: 60,
      },
      action: 'ESCALATE',
      enabled: true,
    },
  })

  await prisma.rule.create({
    data: {
      name: 'High Workload',
      priority: 4,
      condition: {
        type: 'WORKLOAD',
        operator: 'GT',
        value: 0.8,
      },
      action: 'ESCALATE',
      enabled: true,
    },
  })

  await prisma.rule.create({
    data: {
      name: 'Default Approval',
      priority: 5,
      condition: {
        type: 'COMPOSITE',
        operator: 'EQ',
        value: 'default',
      },
      action: 'APPROVE',
      enabled: true,
    },
  })

  console.log('Database seeded successfully!')
  console.log('\nTest credentials:')
  console.log('Admin: admin@example.com / password123')
  console.log('Engineering Manager: manager.eng@example.com / password123')
  console.log('Product Manager: manager.product@example.com / password123')
  console.log('Employee 1: john.doe@example.com / password123')
  console.log('Employee 2: jane.smith@example.com / password123')
  console.log('Employee 3: bob.johnson@example.com / password123')
}

main()
  .catch(e => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
