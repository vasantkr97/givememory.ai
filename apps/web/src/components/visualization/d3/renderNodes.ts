import * as d3 from "d3";
import type { MemoryNode } from "@/types/memory";
import { getBubbleColor, getBubbleRadius, getBubbleStrokeColor, getBubbleTextColor } from "@/lib/utils";

export interface NodePosition {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Prepares node data with initial positions and visual properties
 */
export function prepareNodes(
  rawNodes: any[],
  positionsRef: Map<number, NodePosition>,
  width: number,
  height: number
): MemoryNode[] {
  // Create a set of all node IDs for efficient lookup
  const nodeIdSet = new Set(rawNodes.map(n => n.id));

  return rawNodes.map((node) => {
    const existingPos = positionsRef.get(node.id);

    // Calculate valid connection count (only connections to nodes that exist)
    const validConnectionCount = node.connections
      ? node.connections.filter((conn: any) => nodeIdSet.has(conn.target_id) || nodeIdSet.has(conn.target_global_id)).length
      : 0;

    return {
      ...node,
      type: node.type === "semantic" ? "semantic" : "bubble",
      radius: getBubbleRadius(node.importance),
      x: existingPos?.x ?? width / 2 + (Math.random() - 0.5) * 400,
      y: existingPos?.y ?? height / 2 + (Math.random() - 0.5) * 400,
      fx: existingPos?.fx,
      fy: existingPos?.fy,
      validConnectionCount,
    };
  });
}

/**
 * Renders memory bubbles with circles and text labels
 * Displays local_id (per-user sequential ID) instead of global id
 */
export function renderNodes(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: MemoryNode[],
  onBubbleClick: (d: MemoryNode, event: MouseEvent) => void,
  setSelectedId: (id: number) => void,
  useConstantColor: boolean = false
): d3.Selection<SVGGElement, MemoryNode, SVGGElement, unknown> {
  const nodeGroup = container.append("g").attr("class", "nodes-container");

  const node = nodeGroup
    .selectAll<SVGGElement, MemoryNode>("g")
    .data(nodes, (d: any) => d.id)
    .join("g")
    .attr("class", "memory-bubble")
    .attr("data-id", (d) => d.id)
    .attr("data-local-id", (d) => d.local_id)
    .attr("data-node-stroke", (d) => getBubbleStrokeColor(d.type, d.created_at, useConstantColor))
    .style("cursor", "pointer")
    .style("pointer-events", "all");

  // Add the functional node surface. Selection logic intentionally targets this circle.
  node
    .append("circle")
    .attr("class", "memory-bubble__surface")
    .attr("r", (d) => d.radius!)
    .attr("fill", (d) => getBubbleColor(d.type, d.created_at, useConstantColor))
    .attr("stroke", (d) => getBubbleStrokeColor(d.type, d.created_at, useConstantColor))
    .attr("stroke-width", 1.25)
    .attr("stroke-opacity", 0.72);

  // A quiet outer registration ring adds depth without changing the hit area.
  node
    .append("circle")
    .attr("class", "memory-bubble__halo")
    .attr("r", (d) => d.radius! + 5)
    .attr("fill", "none")
    .attr("stroke", (d) => getBubbleStrokeColor(d.type, d.created_at, useConstantColor))
    .attr("stroke-width", 0.75)
    .attr("stroke-opacity", 0.3)
    .attr("pointer-events", "none");

  // Add text - showing LOCAL_ID (per-user sequential ID)
  node
    .append("text")
    .text((d) => d.local_id.toString())  // Use local_id instead of id
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", (d) => {
      const size = d.radius! / 2.5;
      return `${Math.max(12, Math.min(size, 24))}px`;
    })
    .attr("font-weight", "600")
    .attr("fill", (d) => getBubbleTextColor(d.type))
    .attr("pointer-events", "none")
    .style("user-select", "none");

  // Add click handler - still pass global id for internal use
  node.on("click", (event: MouseEvent, d) => {
    setSelectedId(d.id);  // Use global id for selection/linking
    onBubbleClick(d, event);
  });

  return node;
}

/**
 * Updates node visual states based on selection
 */
export function updateNodeStates(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  selectedId: number | null,
  connectedNodeIds: Set<number>
) {
  container.selectAll<SVGGElement, MemoryNode>(".memory-bubble")
    .each(function(d) {
      const isSelected = d.id === selectedId;
      const isConnected = connectedNodeIds.has(d.id);
      const hasSelection = selectedId !== null;
      const bubble = d3.select(this);
      const defaultStroke = bubble.attr("data-node-stroke") || getBubbleStrokeColor(d.type, d.created_at);

      // Determine if this bubble should be dimmed
      const shouldDim = hasSelection && !isSelected && !isConnected;

      bubble
        .select(".memory-bubble__surface")
        .classed("selected", isSelected)
        .classed("dimmed", shouldDim)
        .classed("connected", isConnected && !isSelected)
        .transition()
        .duration(300)
        .attr("stroke", isSelected ? "#202521" : (isConnected ? "#60716d" : defaultStroke))
        .attr("stroke-width", isSelected ? 3 : (isConnected ? 2 : 1.25))
        .attr("stroke-opacity", isSelected || isConnected ? 1 : 0.72)
        .attr("opacity", shouldDim ? 0.4 : 1);

      // Also dim the text
      bubble
        .select("text")
        .transition()
        .duration(300)
        .attr("opacity", shouldDim ? 0.4 : 1);
    });
}
