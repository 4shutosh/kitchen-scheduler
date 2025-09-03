# kitchen-scheduler

### Problem
At any given moment in a busy restaurant, a critical question arises: what should the kitchen cook next?
This decision is typically made by the Head Chef or Sous Chef, who must juggle dozens of orders, multiple stations, and limited staff. The aim of this project is to support and enhance that decision-making, making the kitchen run more smoothly and efficiently.
This decision is important because it impacts the business directly by affecting: the wait time for the people on a table and for a table, resource optimisation in the kitchen, satisfaction of the guests, and the sentiment of all the people involved across.


### Goal
Create a software system which helps make you decide better, and improve on:
- minimize guest wait (time from order to table served)
- fairness: minimize per-table max wait & spread across tables/courses
- maximize throughput/utilization (reduce idle/clean changeovers)
- quality constraints: deliver a table’s course within a small window (e.g., ±2 min)
