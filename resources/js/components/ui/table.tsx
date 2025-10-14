import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <table
        className={cn(
          'w-full text-sm text-left border-collapse transition-colors duration-300',
          className
        )}
        {...props}
      />
    </div>
  )
}

export function TableHeader(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return (
    <thead
      className="bg-gray-100 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 transition-colors"
      {...props}
    />
  )
}

export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-gray-100 dark:divide-gray-800" {...props} />
}

export function TableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-200',
        props.className
      )}
      {...props}
    />
  )
}

export function TableHead(
  props: React.ThHTMLAttributes<HTMLTableCellElement>
) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 whitespace-nowrap',
        props.className
      )}
      {...props}
    />
  )
}

export function TableCell(
  props: React.TdHTMLAttributes<HTMLTableCellElement>
) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-gray-700 dark:text-gray-300 align-middle',
        props.className
      )}
      {...props}
    />
  )
}
