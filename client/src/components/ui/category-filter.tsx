import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategoryFilterProps) {
  return (
    <section className="py-4 bg-white shadow-sm sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <ScrollArea className="whitespace-nowrap pb-2">
          <div className="flex space-x-3 min-w-max py-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`px-5 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === category 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
                }`}
                onClick={() => onSelectCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}
