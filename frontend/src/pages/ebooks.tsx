"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Clock, Star } from "lucide-react"
import { useEbookSubscriptions } from "@/hooks/use-ebook-subscriptions"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { PlanSelectionModal } from "@/components/ebook/plan-selection-modal"
import { updateEbookSubscription } from "@/lib/ebook-utils"
import { Link } from "react-router-dom"

export default function EbooksPage() {
  const { subscriptions, loading } = useEbookSubscriptions()
  const { user } = useAuth()
  const { toast } = useToast()
  const [showPlanSelection, setShowPlanSelection] = useState(false)
  const [pendingSubscription, setPendingSubscription] = useState<any>(null)

  useEffect(() => {
    // Check if user has any subscriptions that need book selection
    if (subscriptions.length > 0) {
      const needsSelection = subscriptions.find(sub => 
        sub.status === 'active' && 
        sub.planType !== 'multiple' || 
        (sub.planType === 'multiple' && 
         sub.planTitle !== 'Premium' && 
         sub.planTitle !== 'Lifetime' &&
         (!sub.selectedBooks || sub.selectedBooks.length === 0))
      )
      
      if (needsSelection) {
        setPendingSubscription(needsSelection)
        setShowPlanSelection(true)
      }
    }
  }, [subscriptions])

  const handleSelectionComplete = async (selectedBooks: string[]) => {
    if (!pendingSubscription) return

    try {
      await updateEbookSubscription(pendingSubscription.id, {
        selectedBooks,
        updatedAt: new Date()
      })
      
      toast({
        title: "Books Selected",
        description: "Your book selection has been saved successfully!",
      })
      
      setPendingSubscription(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save book selection. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "expired": return "bg-red-100 text-red-800"
      case "cancelled": return "bg-gray-100 text-gray-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">No E-book Subscriptions</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              You don't have any active e-book subscriptions. Choose a plan to start reading!
            </p>
            <Button asChild size="lg">
              <Link to="/pricing">
                View E-book Plans
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My E-book Subscriptions</h1>
          <p className="text-muted-foreground">Manage your e-book plans and access</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{subscription.planTitle}</CardTitle>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Started: {formatDate(subscription.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Expires: {formatDate(subscription.endDate)}</span>
                  </div>
                  
                  {subscription.status === 'active' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800">
                        {getDaysRemaining(subscription.endDate)} days remaining
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Plan Type:</p>
                  <Badge variant="outline">
                    {subscription.planType === 'single' ? 'Single E-book' : 'Multiple E-books'}
                  </Badge>
                </div>

                {subscription.selectedBooks && subscription.selectedBooks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected Books:</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.selectedBooks.length} books selected
                    </p>
                  </div>
                )}

                {subscription.status === 'active' && (
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link to="/my-books">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Read Books
                      </Link>
                    </Button>
                    
                    {subscription.planType !== 'multiple' || 
                     (subscription.planTitle !== 'Premium' && subscription.planTitle !== 'Lifetime') ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setPendingSubscription(subscription)
                          setShowPlanSelection(true)
                        }}
                      >
                        Change Book Selection
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <PlanSelectionModal
          open={showPlanSelection}
          onOpenChange={setShowPlanSelection}
          subscription={pendingSubscription}
          onSelectionComplete={handleSelectionComplete}
        />
      </div>
    </div>
  )
}