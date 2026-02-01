'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const faqs = [
    {
      question: 'How does Founder Note work?',
      answer: 'Simply tap to record and speak your thoughts. Our AI transcribes in real-time with 95%+ accuracy, then automatically categorizes your content into notes, tasks, meetings, and more. From there, you can export to emails, social posts, or action items with one click.'
    },
    {
      question: 'Who is Founder Note for?',
      answer: 'Founder Note is built for founders, executives, and professionals who think faster than they type. If you\'re constantly capturing ideas, managing tasks, and need to stay organized, Founder Note helps you do it all through voice without slowing down.'
    },
    {
      question: 'Is Founder Note only for founders?',
      answer: 'Not at all. While the name was inspired by the founder mindset of building and organizing ideas, Founder Note is for anyone looking to boost their productivity. Students use it to capture lecture notes and study ideas, professionals use it to stay on top of meetings and tasks, and creatives use it to brainstorm freely. Whether you\'re in a corporate setting, running a side project, or just trying to organize your thoughts, Founder Note is built for you.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! Every new user gets a 1-day free trial to explore Founder Note with full access to all features. After the trial ends, plans start at $14.99/month for Pro and $24.99/month for Plus. You can also use our Free tier with 5 notes and 15 minutes of transcription per month. Cancel anytime.'
    },
    {
      question: 'What languages are supported?',
      answer: 'Currently, we support English with high accuracy transcription. We are actively working on adding support for additional languages in future updates.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. All your data is encrypted both in transit and at rest using industry-standard encryption. We never access, read, or analyze your personal content - your voice recordings, transcriptions, and notes remain completely private. Your data is securely stored with enterprise-grade infrastructure, and you maintain full control to export or delete your data at any time.'
    },
    {
      question: 'How does the AI analysis work?',
      answer: 'Our AI analyzes your voice notes to extract key insights, action items, and summaries. It also powers our Ask feature, a semantic search that lets you ask questions about your notes and get instant, relevant answers from your personal knowledge base.'
    },
    {
      question: 'Does Founder Note have apps in the Play Store and App Store?',
      answer: 'No, Founder Note is currently only available as a web app. However, we are working on releasing apps in the Play Store and App Store in the future.'
    }
  ]

  return (
    <section id="faq" ref={sectionRef} className="py-24 px-6 warm-cream-tint">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-display text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg md:text-xl text-gray-500 font-body">
            Everything you need to know about Founder Note.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <button
                className="w-full px-6 py-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-xl font-body font-medium text-gray-900 pr-4 leading-snug">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed font-body text-base border-t border-gray-50 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
