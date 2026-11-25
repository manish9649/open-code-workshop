import React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  amount?: string
  status?: 'pending' | 'verified' | 'rejected'
  reference?: string
  receiptNumber?: string
  receiptUrl?: string
  letterUrl?: string
}

const copy = {
  pending: { title: 'Your donation is under review', text: 'We have received your donation details. Our team is checking the payment with our bank. You will get another email once it is verified.' },
  verified: { title: 'Your donation is verified', text: 'Your payment has been verified. Thank you for supporting our work. Your donation receipt (bill) and thank-you letter are ready below.' },
  rejected: { title: 'We could not verify your donation', text: 'We could not find this payment in our bank account. Please check the transaction ID / UTR and contact us at shivseva1707@gmail.com or +91 9671742116 so we can help.' },
}

const Email = ({ name, amount, status = 'pending', reference, receiptNumber, receiptUrl, letterUrl }: Props) => {
  const c = copy[status] ?? copy.pending
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{c.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Shiv Sewa Welfare Society</Text>
          <Heading style={h1}>{c.title}</Heading>
          <Text style={p}>Dear {name || 'Donor'},</Text>
          <Text style={p}>{c.text}</Text>
          <Section style={box}>
            {amount && <Text style={row}>Amount: {amount}</Text>}
            {reference && <Text style={row}>Transaction / UTR: {reference}</Text>}
            {receiptNumber && <Text style={row}>Receipt No.: {receiptNumber}</Text>}
          </Section>
          {status === 'verified' && receiptUrl && <Button style={btn} href={receiptUrl}>Download receipt</Button>}
          {status === 'verified' && letterUrl && <Text style={p}><a href={letterUrl} style={link}>Download thank-you letter</a></Text>}
          {status === 'verified' && receiptUrl && <Text style={small}>Download links work for 7 days.</Text>}
          <Hr />
          <Text style={small}>Seva Hi Sankalp, Samaj Hi Parivaar.</Text>
        </Container>
      </Body>
    </Html>
  )
}

const subjects = { pending: 'Donation received – under review', verified: 'Donation Receipt and Thank You Letter – Shiv Sewa Welfare Society', rejected: 'Donation could not be verified' }

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => subjects[d['status'] as keyof typeof subjects] ?? subjects.pending,
  displayName: 'Donation status update',
  previewData: { name: 'Manish Gour', amount: '₹1,100', status: 'verified', reference: 'UPI123456', receiptNumber: 'SSW/RCPT/2026/0001', receiptUrl: 'https://shivsewawelfaresociety.com', letterUrl: 'https://shivsewawelfaresociety.com' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const brand = { color: '#e8761b', fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px' }
const h1 = { color: '#1f4d3a', fontSize: '22px', margin: '0 0 16px' }
const p = { fontSize: '15px', lineHeight: '22px', color: '#333333' }
const box = { backgroundColor: '#f7f3ec', borderRadius: '8px', padding: '8px 16px', margin: '12px 0' }
const row = { fontSize: '14px', margin: '6px 0', color: '#333333' }
const btn = { backgroundColor: '#e8761b', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }
const link = { color: '#1f4d3a' }
const small = { fontSize: '12px', color: '#777777' }
