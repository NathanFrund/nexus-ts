import { NxNode } from "./node.ts";
import { NxEdge } from "./edge.ts";
import type {
  EdgeDirection,
  HypergraphWorld,
  SerializedGraph,
} from "../types.ts";

/** Spatial graph — a named collection of nodes and edges with traversal queries. */
export class NxGraph {
  readonly nodes: Map<string, NxNode> = new Map();
  readonly edges: NxEdge[] = [];

  addNode(node: NxNode): void {
    this.nodes.set(node.name, node);
  }

  addEdge(
    from: string,
    to: string,
    options?: {
      distance?: number;
      risk?: number;
      direction?: EdgeDirection;
    },
  ): NxEdge {
    const edge = new NxEdge(from, to, options);
    this.edges.push(edge);
    return edge;
  }

  get nodeNames(): string[] {
    return Array.from(this.nodes.keys());
  }

  nodeNamed(name: string): NxNode {
    const node = this.nodes.get(name);
    if (!node) {
      throw new Error(`Node "${name}" not found`);
    }
    return node;
  }

  edgesFrom(nodeName: string): NxEdge[] {
    return this.edges.filter((e) => e.connectsNode(nodeName));
  }

  neighborsOf(nodeName: string): string[] {
    return this.edges
      .filter((e) => e.connectsNode(nodeName) && e.allowsTraversalFrom(nodeName))
      .map((e) => e.otherEndOf(nodeName));
  }

  toJSON(): SerializedGraph {
    const nodes: SerializedGraph["nodes"] = {};
    for (const [name, node] of this.nodes) {
      nodes[name] = {
        label: node.label === name ? undefined : node.label,
        properties: node.allProperties(),
      };
    }
    const edges = this.edges.map((e) => ({
      from: e.node1,
      to: e.node2,
      distance: e.distance === 1 ? undefined : e.distance,
      risk: e.risk === 0.0 ? undefined : e.risk,
      direction: e.direction === "both" ? undefined : e.direction,
    }));
    return { nodes, edges };
  }

  static fromJSON(data: SerializedGraph): NxGraph {
    const graph = new NxGraph();
    for (const [name, nodeData] of Object.entries(data.nodes)) {
      const node = new NxNode(name, nodeData.label);
      if (nodeData.properties) {
        for (const [key, value] of Object.entries(nodeData.properties)) {
          node.setProperty(key, value);
        }
      }
      graph.addNode(node);
    }
    for (const edgeData of data.edges) {
      graph.addEdge(edgeData.from, edgeData.to, {
        distance: edgeData.distance,
        risk: edgeData.risk,
        direction: edgeData.direction,
      });
    }
    return graph;
  }

  static loadWorld(data: HypergraphWorld): NxGraph {
    const graph = new NxGraph();
    for (const graphData of Object.values(data.graphs)) {
      for (const [nodeId, props] of Object.entries(graphData.nodes)) {
        if (!graph.nodes.has(nodeId)) {
          const node = new NxNode(nodeId, props.label);
          if (props.properties) {
            for (const [key, value] of Object.entries(props.properties)) {
              node.setProperty(key, value);
            }
          }
          graph.addNode(node);
        }
      }
      for (const edgeData of graphData.edges) {
        graph.addEdge(edgeData.from, edgeData.to, {
          distance: edgeData.distance,
          risk: edgeData.risk,
          direction: edgeData.direction,
        });
      }
    }
    return graph;
  }
}
