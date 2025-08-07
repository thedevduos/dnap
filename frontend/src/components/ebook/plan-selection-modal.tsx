"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { getBooksForPlanSelection } from "@/lib/ebook-utils"
import { BookOpen, Check } from "lucide-react"

interface PlanSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: any
  onSelectionComplete: (selectedBooks: string[]) => void
}

export function PlanSelectionModal({ 
  open, 
  onOpenChange, 
  subscription, 
  onSelectionComplete 
}: PlanSelectionModalProps) {
  const [availableBooks, setAvailableBooks] = useState<any[]>([])
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (open && subscription) {
      loadAvailableBooks()
    }
  }, [open, subscription])

  const loadAvailableBooks = async () => {
    try {
      const books = await getBooksForPlanSelection(subscription.planId, subscription.planType)
      setAvailableBooks(books)
      setSelectedBooks(subscription.selectedBooks || [])
    } catch (error) {
      console.error("Error loading books:", error)
      toast({
        title: "Error",
        description: "Failed to load available books",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBookToggle = (bookId: string) => {
    const maxBooks = subscription.maxBooks
    const currentSelection = selectedBooks.includes(bookId)
      ? selectedBooks.filter(id => id !== bookId)
      : [...selectedBooks, bookId]

    if (maxBooks && currentSelection.length > maxBooks) {
      toast({
        title: "Selection Limit Reached",
        description: `You can only select up to ${maxBooks} books for this plan`,
        variant: "destructive",
      })
      return
    }

    setSelectedBooks(currentSelection)
  }

  const handleConfirmSelection = () => {
    const maxBooks = subscription.maxBooks
    
    if (maxBooks && selectedBooks.length !== maxBooks) {
      toast({
        title: "Selection Required",
        description: `Please select exactly ${maxBooks} books for this plan`,
        variant: "destructive",
      })
      return
    }

    onSelectionComplete(selectedBooks)
    onOpenChange(false)
  }

  if (!subscription) return null

  // Don't show modal for Premium and Lifetime plans (unlimited access)
  if (subscription.planType === 'multiple' && 
      (subscription.planTitle === 'Premium' || subscription.planTitle === 'Lifetime')) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Your Books - {subscription.planTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Plan Details</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Plan: {subscription.planTitle}</p>
              <p>• Duration: {subscription.duration} days</p>
              {subscription.maxBooks && (
                <p>• Books allowed: {subscription.maxBooks}</p>
              )}
              <p>• Selected: {selectedBooks.length} / {subscription.maxBooks || 'unlimited'}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading available books...</p>
            </div>
          ) : availableBooks.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No books available for this plan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableBooks.map((book) => (
                <Card 
                  key={book.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedBooks.includes(book.id) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleBookToggle(book.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedBooks.includes(book.id)}
                        onChange={() => handleBookToggle(book.id)}
                        className="mt-1"
                      />
                      <div className="w-16 h-20 flex-shrink-0">
                        <img
                          src={book.imageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
                        <p className="text-xs text-muted-foreground">by {book.author}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {book.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-900">Selection Confirmation</h4>
                <p className="text-sm text-yellow-800">
                  Your book selection will be final and cannot be changed during your subscription period.
                  {subscription.maxBooks && ` Please select exactly ${subscription.maxBooks} books.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={subscription.maxBooks && selectedBooks.length !== subscription.maxBooks}
            >
              Confirm Selection ({selectedBooks.length} books)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}