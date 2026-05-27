import { PageMeta } from '@/components/seo/PageMeta';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { jobsByStatus } from '@/features/townow-flow/driverMockData';

export default function DriverCompletedRidesPage() {
  const rows = jobsByStatus('completed');

  return (
    <>
      <PageMeta title="Completed rides" description="Past jobs." keywords={['driver']} />
      <div className="space-y-6">
        <h1 className="font-montserrat text-2xl font-semibold tracking-tight">Completed rides</h1>
        <Card className="border-border">
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Payout and rating integration can attach here.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(j.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{j.customerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {j.pickup} → {j.dropoff}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
