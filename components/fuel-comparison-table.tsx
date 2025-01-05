"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const FuelComparisonTable = () => {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 w-32">Fuel Type</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Energy Content/Efficiency</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Combustion Products/Emissions</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Resource Availability/Sustainability</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Processing/Handling</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Cost</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Environmental Friendliness</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <TableCell className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-gray-800/50">Raw Banana Peel</TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-red-500 dark:text-red-400 font-medium">Low:</span> High moisture content significantly reduces heating value. Burning is often incomplete and inefficient.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-yellow-500 dark:text-yellow-400 font-medium">Moderate:</span> Releases CO2 (considered carbon neutral if sustainably sourced), some particulate matter (smoke), and potentially other organic compounds. Can produce unpleasant odors.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-green-500 dark:text-green-400 font-medium">High:</span> Readily available as a waste product from banana consumption. Highly renewable.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-red-500 dark:text-red-400 font-medium">Low:</span> Bulky, difficult to handle and store in large quantities. Requires drying before burning for better efficiency.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-green-500 dark:text-green-400 font-medium">Very Low/Free:</span> Essentially a waste product, no direct cost.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-yellow-500 dark:text-yellow-400 font-medium">Moderate:</span> Potentially carbon neutral as it utilizes waste. However, inefficient burning can lead to smoke and air pollution. Requires proper disposal.
            </TableCell>
          </TableRow>
          <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <TableCell className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-gray-800/50">Peel Briquettes</TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-green-500 dark:text-green-400 font-medium">Moderate to High:</span> Processing (drying, compressing) significantly reduces moisture content and increases energy density compared to raw peels. Burns more consistently and efficiently.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-green-500 dark:text-green-400 font-medium">Lower than raw peels, better than coal:</span> Releases CO2 (carbon neutral if sustainably sourced), reduced particulate matter compared to raw peels due to more complete combustion.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-yellow-500 dark:text-yellow-400 font-medium">Moderate:</span> Relies on the availability of banana peels. Renewable as long as banana production continues.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-yellow-500 dark:text-yellow-400 font-medium">Moderate:</span> Easier to handle, store, and transport compared to raw peels. Requires processing equipment.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-yellow-500 dark:text-yellow-400 font-medium">Low:</span> Involves processing costs but generally lower than coal. Can be a cost-effective alternative.
            </TableCell>
            <TableCell className="text-gray-700 dark:text-gray-300">
              <span className="text-green-500 dark:text-green-400 font-medium">High:</span> Uses waste, improves combustion efficiency, reduces emissions reliance on fossil fuels. Carbon neutral potential.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export default FuelComparisonTable 