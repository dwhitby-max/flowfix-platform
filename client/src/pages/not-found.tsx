import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <FileQuestion className="h-20 w-20 text-muted-foreground/50" />
          <h1 className="mt-6 text-3xl font-bold">Page Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button
            className="mt-6"
            onClick={() => (window.location.href = "/")}
            data-testid="button-home"
          >
            Go to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
