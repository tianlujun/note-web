import { useEffect, useState, useCallback } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react'
import dagre from 'dagre'
import '@xyflow/react/dist/style.css'
import { api, type LinkIndex } from '@/lib/api'
import { useTabStore } from '@/stores/tab-store'
import { Skeleton } from '@/components/ui/skeleton'

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
) {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 40 })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 20,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export function GraphView({ onClose }: { onClose: () => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { openTab } = useTabStore()

  useEffect(() => {
    api.getLinkIndex()
      .then((data: LinkIndex) => {
        const initialNodes: Node[] = data.nodes.map((n) => ({
          id: n.id,
          data: { label: n.label },
          position: { x: 0, y: 0 },
        }))

        const initialEdges: Edge[] = data.edges.map((e, i) => ({
          id: `edge-${i}`,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
        }))

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          initialNodes,
          initialEdges
        )

        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
        setIsLoading(false)
      })
      .catch((e) => {
        setError((e as Error).message)
        setIsLoading(false)
      })
  }, [setNodes, setEdges])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      openTab(node.id, (node.data as { label: string }).label)
      onClose()
    },
    [openTab, onClose]
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-64 w-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Failed to load graph</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No connections yet</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => (node.selected ? '#C53E3E' : '#737373')}
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </div>
  )
}
