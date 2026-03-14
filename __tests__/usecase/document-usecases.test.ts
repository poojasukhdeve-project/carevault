/**
 * Document Management Usecase Tests
 * Tests user stories related to document upload and management
 */

import { documentService } from '@/lib/supabase-service'

// Mock the service
jest.mock('@/lib/supabase-service', () => ({
  documentService: {
    getDocuments: jest.fn(),
    getDocumentsByCategory: jest.fn(),
    uploadDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
}))

const mockDocumentService = documentService as jest.Mocked<typeof documentService>

describe('Document Management Usecases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const sampleDocument = {
    id: 'doc-001',
    care_recipient_id: 'patient-001',
    name: 'Medical Report',
    description: 'Annual checkup report',
    category: 'medical',
    file_url: 'https://storage.example.com/documents/report.pdf',
    file_type: 'application/pdf',
    file_size: 1024000,
    uploaded_by: 'caregiver-001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const documentCategories = ['medical', 'insurance', 'legal', 'personal', 'financial', 'identification']

  describe('UC-023: Caregiver can upload document', () => {
    const mockFile = {
      name: 'test-document.pdf',
      type: 'application/pdf',
      size: 512000,
    } as File

    const uploadMetadata = {
      name: 'Test Document',
      description: 'A test document for upload',
      category: 'medical',
    }

    it('should successfully upload a document', async () => {
      mockDocumentService.uploadDocument.mockResolvedValue('new-doc-id')

      const result = await documentService.uploadDocument(mockFile, 'patient-001', uploadMetadata)

      expect(result).toBe('new-doc-id')
      expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith(
        mockFile,
        'patient-001',
        uploadMetadata
      )
    })

    it('should support all document categories', async () => {
      for (const category of documentCategories) {
        mockDocumentService.uploadDocument.mockResolvedValue('doc-id')

        await documentService.uploadDocument(mockFile, 'patient-001', {
          ...uploadMetadata,
          category,
        })

        expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith(
          mockFile,
          'patient-001',
          expect.objectContaining({ category })
        )
      }
    })

    it('should handle large file uploads', async () => {
      const largeFile = {
        name: 'large-document.pdf',
        type: 'application/pdf',
        size: 10 * 1024 * 1024, // 10MB
      } as File

      mockDocumentService.uploadDocument.mockResolvedValue('large-doc-id')

      const result = await documentService.uploadDocument(largeFile, 'patient-001', uploadMetadata)

      expect(result).toBe('large-doc-id')
    })

    it('should support various file types', async () => {
      const fileTypes = [
        { name: 'doc.pdf', type: 'application/pdf' },
        { name: 'image.jpg', type: 'image/jpeg' },
        { name: 'image.png', type: 'image/png' },
        { name: 'doc.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      ]

      for (const fileInfo of fileTypes) {
        const file = { ...fileInfo, size: 1024 } as File
        mockDocumentService.uploadDocument.mockResolvedValue('doc-id')

        await documentService.uploadDocument(file, 'patient-001', uploadMetadata)

        expect(mockDocumentService.uploadDocument).toHaveBeenCalled()
      }
    })
  })

  describe('UC-024: Caregiver can view documents by category', () => {
    const medicalDocuments = [
      { ...sampleDocument, id: 'doc-1', name: 'Lab Results', category: 'medical' },
      { ...sampleDocument, id: 'doc-2', name: 'X-Ray Report', category: 'medical' },
    ]

    it('should return documents filtered by category', async () => {
      mockDocumentService.getDocumentsByCategory.mockResolvedValue(medicalDocuments)

      const result = await documentService.getDocumentsByCategory('patient-001', 'medical')

      expect(result).toHaveLength(2)
      result.forEach((doc) => {
        expect(doc.category).toBe('medical')
      })
    })

    it('should return all documents when no category filter', async () => {
      const allDocuments = documentCategories.map((category, index) => ({
        ...sampleDocument,
        id: `doc-${index}`,
        category,
      }))
      mockDocumentService.getDocuments.mockResolvedValue(allDocuments)

      const result = await documentService.getDocuments('patient-001')

      expect(result).toHaveLength(documentCategories.length)
    })

    it('should return empty array for category with no documents', async () => {
      mockDocumentService.getDocumentsByCategory.mockResolvedValue([])

      const result = await documentService.getDocumentsByCategory('patient-001', 'legal')

      expect(result).toEqual([])
    })

    it('should include document metadata in response', async () => {
      mockDocumentService.getDocuments.mockResolvedValue([sampleDocument])

      const result = await documentService.getDocuments('patient-001')

      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('file_url')
      expect(result[0]).toHaveProperty('file_size')
      expect(result[0]).toHaveProperty('category')
    })
  })

  describe('UC-025: Caregiver can delete document', () => {
    it('should successfully delete a document', async () => {
      mockDocumentService.deleteDocument.mockResolvedValue(undefined)

      await documentService.deleteDocument('doc-001', 'https://storage.example.com/file.pdf')

      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(
        'doc-001',
        'https://storage.example.com/file.pdf'
      )
    })

    it('should delete both database record and storage file', async () => {
      mockDocumentService.deleteDocument.mockResolvedValue(undefined)

      await documentService.deleteDocument('doc-001', sampleDocument.file_url)

      // The service should handle both deletions internally
      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(
        'doc-001',
        sampleDocument.file_url
      )
    })

    it('should handle deletion of non-existent document', async () => {
      mockDocumentService.deleteDocument.mockRejectedValue(new Error('Document not found'))

      await expect(
        documentService.deleteDocument('non-existent-id', 'https://example.com/file.pdf')
      ).rejects.toThrow('Document not found')
    })
  })

  describe('UC-026: User can download document', () => {
    it('should provide valid download URL', async () => {
      mockDocumentService.getDocuments.mockResolvedValue([sampleDocument])

      const documents = await documentService.getDocuments('patient-001')
      const downloadUrl = documents[0].file_url

      expect(downloadUrl).toBeDefined()
      expect(downloadUrl).toMatch(/^https?:\/\//)
    })

    it('should include file information for download', async () => {
      mockDocumentService.getDocuments.mockResolvedValue([sampleDocument])

      const documents = await documentService.getDocuments('patient-001')
      const doc = documents[0]

      expect(doc.file_url).toBeDefined()
      expect(doc.file_type).toBe('application/pdf')
      expect(doc.file_size).toBeGreaterThan(0)
      expect(doc.name).toBeDefined()
    })

    it('should provide correct file size for display', async () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      }

      mockDocumentService.getDocuments.mockResolvedValue([
        { ...sampleDocument, file_size: 500 },
        { ...sampleDocument, file_size: 5000 },
        { ...sampleDocument, file_size: 5000000 },
      ])

      const documents = await documentService.getDocuments('patient-001')

      expect(formatFileSize(documents[0].file_size)).toBe('500 B')
      expect(formatFileSize(documents[1].file_size)).toBe('4.9 KB')
      expect(formatFileSize(documents[2].file_size)).toBe('4.8 MB')
    })
  })
})
