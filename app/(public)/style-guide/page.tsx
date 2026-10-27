"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const sectionClass = "flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm";

const statusStyles = [
  { label: "Active", className: "bg-success-light text-success-foreground" },
  { label: "Draft", className: "bg-info-light text-info-foreground" },
  { label: "Off market", className: "bg-warning-light text-warning-foreground" },
  { label: "Sold", className: "bg-neutral-light text-neutral-foreground" },
];

export default function StyleGuidePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-text-primary">Style guide</h1>
        <p className="text-sm text-text-secondary">
          Scratch page for checking tokens and primitives. Remove it once the real pages exist.
        </p>
      </header>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary">Typography</h2>
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold text-text-primary">Section heading 18/600</p>
          <p className="text-sm text-text-primary">Body text 14/400 in the primary text token.</p>
          <p className="text-xs text-text-muted">Muted meta 12/400</p>
          <p className="text-xl font-bold text-accent">$1,250,000</p>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button asChild variant="secondary">
            <a href="/properties">Link button</a>
          </Button>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary">Badges</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusStyles.map((status) => (
            <Badge className={status.className} key={status.label}>
              {status.label}
            </Badge>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary">Form fields</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="style-guide-address">Address</Label>
            <Input id="style-guide-address" placeholder="123 Main St" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="style-guide-status">Status</Label>
            <Select defaultValue="active">
              <SelectTrigger className="w-full" id="style-guide-status">
                <SelectValue placeholder="Choose a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="off_market">Off market</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="style-guide-price">Price</Label>
            <Input id="style-guide-price" inputMode="numeric" placeholder="$450000" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="style-guide-description">Description</Label>
          <Textarea id="style-guide-description" placeholder="Notes about this listing" rows={3} />
          <p className="text-xs text-error">Inline error text sits under the field.</p>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary">Card, table and skeleton</h2>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Recent listings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>123 Main St</TableCell>
                  <TableCell>
                    <Badge className={statusStyles[0]?.className}>Active</Badge>
                  </TableCell>
                  <TableCell className="text-accent">$1,250,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary">Overlays</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog title</DialogTitle>
                <DialogDescription>Confirms the overlay and surface tokens.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete property</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete 123 Main St?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>The mobile filter panel lives here.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Dashboard</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" onClick={() => toast.success("Saved")}>
            Show toast
          </Button>
        </div>
      </section>
    </div>
  );
}
