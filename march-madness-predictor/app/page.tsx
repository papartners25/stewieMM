import { BracketVisualizer } from "@/components/bracket-visualizer"
import { PredictionControls } from "@/components/prediction-controls"
import { PredictionStats } from "@/components/prediction-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">March Madness Predictor</h1>
          <p className="text-muted-foreground">Run predictions, visualize brackets, and analyze tournament outcomes</p>
        </div>

        <Tabs defaultValue="bracket" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="logs">Prediction Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Bracket</CardTitle>
                <CardDescription>Visualize the predicted March Madness bracket</CardDescription>
              </CardHeader>
              <CardContent>
                <PredictionControls />
                <div className="mt-6 overflow-auto">
                  <BracketVisualizer />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prediction Statistics</CardTitle>
                <CardDescription>Detailed statistics and analysis of the predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <PredictionStats />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prediction Logs</CardTitle>
                <CardDescription>Detailed logs from the prediction process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] overflow-auto rounded-md bg-muted p-4">
                  <pre className="text-sm whitespace-pre-wrap" id="prediction-logs">
                    Run a prediction to see logs...
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

