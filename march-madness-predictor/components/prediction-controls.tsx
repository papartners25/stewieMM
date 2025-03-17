"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Play } from "lucide-react"
import { runPrediction, savePrediction } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

export function PredictionControls() {
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Update the handleRunPrediction function to properly dispatch the event
  const handleRunPrediction = async () => {
    setIsRunning(true)
    try {
      const result = await runPrediction()

      // Update the bracket visualization with the new data
      if (typeof window !== "undefined") {
        console.log("Dispatching prediction event with data:", result)

        // Make sure we're passing both predictions and logs in the event
        const event = new CustomEvent("predictionComplete", {
          detail: {
            predictions: result.predictions,
            logs: result.logs,
          },
        })
        window.dispatchEvent(event)

        // Update logs tab
        const logsElement = document.getElementById("prediction-logs")
        if (logsElement && result.logs) {
          logsElement.textContent = JSON.stringify(result.logs, null, 2)
        }
      }

      toast({
        title: "Prediction Complete",
        description: "The bracket has been successfully generated.",
      })
    } catch (error) {
      console.error("Prediction failed:", error)
      toast({
        title: "Prediction Failed",
        description: "There was an error running the prediction.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleSavePrediction = async () => {
    setIsSaving(true)
    try {
      await savePrediction()
      toast({
        title: "Bracket Saved",
        description: "The bracket has been successfully saved.",
      })
    } catch (error) {
      console.error("Save failed:", error)
      toast({
        title: "Save Failed",
        description: "There was an error saving the bracket.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-4">
      <Button onClick={handleRunPrediction} disabled={isRunning} className="bg-primary hover:bg-primary/90">
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Prediction...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Prediction
          </>
        )}
      </Button>

      <Button onClick={handleSavePrediction} disabled={isSaving || isRunning} variant="outline">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Bracket
          </>
        )}
      </Button>
    </div>
  )
}

