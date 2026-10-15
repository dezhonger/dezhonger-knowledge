import { subjects } from '../subject-data.mjs'
import { expandSubjects } from '../subject-expansions.mjs'
import { visionModules } from './cv-curriculum.mjs'

// Keep the original topic identifiers when splitting the former AI section.
export function createAlgoCatalog() {
  const source = structuredClone(subjects)
  if (!source.algo.groups.some(group => group.id === 'engineering')) expandSubjects(source)
  const groups = source.algo.groups
  const modules = (groupId) => groups.find(group => group.id === groupId).modules.map((module, index) => ({
    ...module,
    id: `${groupId}-${String(index + 1).padStart(2, '0')}`,
    concepts: module.concepts.map((concept, conceptIndex) => ({
      ...(typeof concept === 'string' ? {
        title: concept,
        explanation: `${concept}是“${module.title}”中的核心知识。${module.summary}`,
        method: `先识别问题对象、条件和目标，再把“${concept}”与本章其他概念建立联系。${module.example}`,
        example: module.example,
        pitfall: `只记住“${concept}”的名称而不检查对象、条件、范围和证据，会导致机械套用。`,
      } : concept),
      id: `${groupId}-${String(index + 1).padStart(2, '0')}-${String(conceptIndex + 1).padStart(2, '0')}`,
    })),
  }))
  const ai = modules('ai')
  return [
    { id: 'competitive', label: '算法竞赛', english: 'Competitive Programming', description: '从正确性证明到复杂度分析，从基本数据结构到图论、数论与计算几何。', guide: '先学习复杂度、基础数据结构与搜索，再进入贪心和动态规划；图论、字符串与数学专题可以按题目需要交叉学习。每次实现都应说明成立条件，并检查边界输入。', modules: modules('competitive') },
    { id: 'engineering', label: '工程算法', english: 'Engineering Algorithms', description: '理解数据库、分布式系统、流式计算与安全协议背后的算法。', guide: '从数据库索引和查询代价出发，再学习分布式一致性与近似统计。把吞吐、延迟、内存、误差和故障模型一起写入问题定义。', modules: modules('engineering') },
    { id: 'machine-learning', label: '机器学习', english: 'Machine Learning', description: '围绕数据、模型、优化与泛化，建立从经典方法到深度学习的知识框架。', guide: '先掌握数据划分、损失函数和评价指标，建立一个简单基线；再学习优化方法与深度网络。所有调参都在训练集与验证集上完成，最终测试集用于独立评估。', modules: ai.slice(0, 3) },
    { id: 'llm', label: '大模型', english: 'Large Language Models', description: '串起语言建模、对齐微调、推理优化、检索增强与系统评测。', guide: '从 Token 与自回归建模开始，理解 Transformer 和解码过程；再按任务选择提示、检索或微调，并使用固定评测集比较质量、成本和延迟。', modules: ai.slice(3) },
    { id: 'vision', label: '计算机视觉', english: 'Computer Vision', description: '从像素与几何出发，学习分类、检测、分割、跟踪和视觉语言模型。', guide: '先理解图像表示、坐标和滤波，再学习视觉网络；沿分类、检测、分割、跟踪逐步建立任务模型，最后连接自监督表征和多模态。评估时同时关注数据划分、误检漏检、遮挡与场景变化。', modules: visionModules },
  ]
}
