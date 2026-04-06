"""가드레일: Fallback 응답 풀 + 판정 로직"""

import random

FALLBACK_RESPONSES = {
    "out_of_scope": [
        "포트폴리오와 경력에 관한 질문에 답변드리고 있어요. 궁금한 점이 있으시면 말씀해주세요.",
        "저는 이용섭님의 포트폴리오 에이전트예요. 경력이나 프로젝트에 대해 물어봐주세요.",
        "해당 질문은 제 답변 범위 밖이에요. 경력, 기술 스택, 프로젝트에 대해 질문해주시면 답변드릴게요.",
    ],
    "out_of_scope_warning": [
        "저는 이용섭님의 포트폴리오 에이전트예요. 아래 질문을 참고해주세요.",
        "경력이나 프로젝트 관련 질문에만 답변드릴 수 있어요. 궁금한 게 있으시면 말씀해주세요.",
    ],
    "abuse": [
        "죄송합니다. 해당 요청은 처리할 수 없습니다.",
        "죄송합니다. 해당 내용은 답변드리기 어렵습니다.",
    ],
    "session_limit": [
        "추가 문의 사항이 있으시면 이메일로 연락 부탁드립니다. 감사합니다.",
        "도움이 필요하신 부분이 있으시면 이메일로 연락 부탁드립니다. 포트폴리오를 살펴봐 주셔서 감사합니다.",
    ],
}


def get_fallback(key: str) -> str:
    """랜덤 fallback 응답 반환"""
    responses = FALLBACK_RESPONSES.get(key, FALLBACK_RESPONSES["out_of_scope"])
    return random.choice(responses)


def check_guardrail(intent: str, guardrail_count: int) -> dict:
    """가드레일 판정

    Args:
        intent: 분류된 의도
        guardrail_count: 현재 누적 위반 횟수

    Returns:
        {
            "action": "ALLOW" | "SOFT_BLOCK" | "HARD_BLOCK" | "SESSION_END",
            "response": fallback 응답 텍스트 (ALLOW 시 None),
            "new_count": 업데이트된 위반 횟수,
            "session_ended": 세션 종료 여부
        }
    """
    if intent in ("CAREER", "TECHNICAL", "CONTACT", "GREETING"):
        return {
            "action": "ALLOW",
            "response": None,
            "new_count": guardrail_count,
            "session_ended": False,
        }

    if intent == "ABUSE":
        new_count = guardrail_count + 1
        if new_count >= 3:
            return {
                "action": "SESSION_END",
                "response": get_fallback("session_limit"),
                "new_count": new_count,
                "session_ended": True,
            }
        return {
            "action": "HARD_BLOCK",
            "response": get_fallback("abuse"),
            "new_count": new_count,
            "session_ended": False,
        }

    # OUT_OF_SCOPE
    new_count = guardrail_count + 1

    if new_count >= 3:
        return {
            "action": "SESSION_END",
            "response": get_fallback("session_limit"),
            "new_count": new_count,
            "session_ended": True,
        }

    if new_count == 2:
        return {
            "action": "SOFT_BLOCK",
            "response": get_fallback("out_of_scope_warning"),
            "new_count": new_count,
            "session_ended": False,
        }

    # 1회 위반
    return {
        "action": "SOFT_BLOCK",
        "response": get_fallback("out_of_scope"),
        "new_count": new_count,
        "session_ended": False,
    }
